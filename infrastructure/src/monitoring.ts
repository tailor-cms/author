import * as aws from '@pulumi/aws';
import type * as pulumi from '@pulumi/pulumi';
import type * as studion from '@studion/infra-code-blocks';

interface MonitoringArgs {
  namePrefix: string;
  db: studion.Database;
  webServer: studion.WebServer;
  // Public domain. Used by the Route 53 health check that probes the app
  // from outside AWS.
  domain: pulumi.Input<string>;
  // SNS email subscription is created only when provided. The subscription
  // must be confirmed once via the link AWS emails to the address.
  alertEmail?: string;
  // Slack via AWS Chatbot, subscribed to the same SNS topic. Requires a
  // ONE-TIME manual workspace authorization in the AWS console (the Slack
  // OAuth handshake Pulumi can't perform); that yields the workspace
  // (team) id. Both ids must be set for the Slack channel to be wired up.
  slackWorkspaceId?: string;
  slackChannelId?: string;
}

/**
 * Down-reporting for the single-task ECS service. CloudWatch alarms feed an
 * SNS topic (email + any other subscribers).
 *
 * Leans on the health slice's two endpoints by design:
 *  - the ALB target check stays on the shallow /api/healthcheck (set in
 *    index.ts) so a dependency blip can't crash-loop the only task;
 *  - a Route 53 health check probes /api/health/ready from outside AWS, so
 *    a real outage (incl. DB down -> 503) is detected
 */
export function setupMonitoring({
  namePrefix,
  db,
  webServer,
  domain,
  alertEmail,
  slackWorkspaceId,
  slackChannelId,
}: MonitoringArgs) {
  const topic = new aws.sns.Topic(`${namePrefix}-alerts`, {});
  if (alertEmail) {
    new aws.sns.TopicSubscription(`${namePrefix}-alerts-email`, {
      topic: topic.arn,
      protocol: 'email',
      endpoint: alertEmail,
    });
  }
  if (slackWorkspaceId && slackChannelId) {
    setupSlack(namePrefix, topic.arn, slackWorkspaceId, slackChannelId);
  }
  // SNS targets fired on a CloudWatch alarm STATE TRANSITION;
  // (they fire once on the change, not on every evaluation while in a state):
  //   - alarmActions: on entering ALARM (threshold breached) -> "it broke".
  //   - okActions:    on returning to OK (recovered) -> "it's resolved", so
  //                   the channel gets an all-clear, not just the alert.
  // Both point at the same topic, so email/Slack receive both messages. (A
  // third hook, insufficientDataActions, covers the INSUFFICIENT_DATA state;
  // e.g. the metric stopped reporting; but we don't use it here.)
  const actions = { alarmActions: [topic.arn], okActions: [topic.arn] };

  // CloudWatch "dimensions" pin a metric to one specific resource. These
  // scope the two ALB alarms below to THIS load balancer + target group;
  // without them an alarm would read aggregate data across every ALB in the
  // account.
  const albDims = {
    TargetGroup: webServer.lb.targetGroup.arnSuffix,
    LoadBalancer: webServer.lb.lb.arnSuffix,
  };

  // No healthy targets = app down / failing the shallow liveness check.
  new aws.cloudwatch.MetricAlarm(`${namePrefix}-alb-unhealthy-hosts`, {
    namespace: 'AWS/ApplicationELB',
    metricName: 'UnHealthyHostCount',
    comparisonOperator: 'GreaterThanOrEqualToThreshold',
    threshold: 1,
    period: 60,
    evaluationPeriods: 2,
    statistic: 'Maximum',
    // How to evaluate periods with NO data points. `breaching` counts "no
    // data" as a threshold breach: the ALB stops publishing
    // UnHealthyHostCount when the target group has no targets at all (e.g. the
    // task is gone), so for an availability alarm that silence should itself
    // fire rather than be ignored. (The 5xx alarm below uses the opposite,
    // `notBreaching` - no errors reported is good.)
    treatMissingData: 'breaching',
    dimensions: albDims,
    ...actions,
  });

  // 5xx spike = a dependency outage the shallow liveness check ignores.
  new aws.cloudwatch.MetricAlarm(`${namePrefix}-alb-5xx`, {
    namespace: 'AWS/ApplicationELB',
    metricName: 'HTTPCode_Target_5XX_Count',
    comparisonOperator: 'GreaterThanThreshold',
    threshold: 2,
    period: 60,
    evaluationPeriods: 1,
    statistic: 'Sum',
    treatMissingData: 'notBreaching',
    dimensions: albDims,
    ...actions,
  });

  const dbDims = { DBInstanceIdentifier: db.instance.identifier };
  new aws.cloudwatch.MetricAlarm(`${namePrefix}-rds-cpu`, {
    namespace: 'AWS/RDS',
    metricName: 'CPUUtilization',
    comparisonOperator: 'GreaterThanThreshold',
    threshold: 85,
    period: 300,
    evaluationPeriods: 3,
    statistic: 'Average',
    dimensions: dbDims,
    ...actions,
  });
  new aws.cloudwatch.MetricAlarm(`${namePrefix}-rds-storage`, {
    namespace: 'AWS/RDS',
    metricName: 'FreeStorageSpace',
    comparisonOperator: 'LessThanThreshold',
    threshold: 2 * 1024 ** 3, // 2 GiB
    period: 300,
    evaluationPeriods: 1,
    statistic: 'Average',
    dimensions: dbDims,
    ...actions,
  });

  // Route 53 is a global service and publishes its CloudWatch metrics
  // (HealthCheckStatus) ONLY to us-east-1. CloudWatch alarms are regional and
  // read only their own region's metrics, so an alarm anywhere else would find
  // no data and - with treatMissingData 'breaching' - sit permanently in ALARM
  // (constant false pages). Rather than create a broken alarm, we only stand up
  // this outside-in check when the stack runs in us-east-1;
  let readinessCheck: aws.route53.HealthCheck | undefined;
  if (aws.config.region === 'us-east-1') {
    // Probes https://<domain>/api/health/ready from Route 53's global
    // checkers. /api/health/ready returns 200 when the DB is reachable and 503
    // otherwise, so this trips on a genuine outage.
    readinessCheck = new aws.route53.HealthCheck(`${namePrefix}-readiness-hc`, {
      type: 'HTTPS',
      fqdn: domain,
      port: 443,
      resourcePath: '/api/health/ready',
      requestInterval: 30,
      failureThreshold: 3,
      tags: { Name: `${namePrefix}-readiness` },
    });
    new aws.cloudwatch.MetricAlarm(`${namePrefix}-readiness-down`, {
      namespace: 'AWS/Route53',
      metricName: 'HealthCheckStatus',
      comparisonOperator: 'LessThanThreshold',
      threshold: 1,
      period: 60,
      evaluationPeriods: 1,
      statistic: 'Minimum',
      treatMissingData: 'breaching',
      dimensions: { HealthCheckId: readinessCheck.id },
      ...actions,
    });
  }

  return { snsTopic: topic, readinessCheck };
}

// AWS managed policy granting read-only access to CloudWatch (metrics,
// alarms, logs). Used twice below: as the channel role's permissions and as
// the guardrail ceiling.
const CLOUDWATCH_READ_ONLY = 'arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess';

/**
 * Wires a Slack channel to the SNS topic; managed AWS service that
 * bridges AWS and chat platforms like Slack and Teams. It does two things:
 * it relays SNS notifications into a channel, and it lets channel members run
 * AWS CLI commands and query resources by typing in the channel. We only want
 * the first (alarm -> SNS topic -> Chatbot -> formatted Slack message), but
 * the command path is available to anyone in the channel, so it must be
 * locked down.
 *
 * Permissions model: an action triggered from the channel is allowed only if
 * BOTH the channel IAM role and the "guardrail" policies permit it (an
 * intersection). The guardrail is a hard ceiling layered on top of the role,
 * and - importantly - if it is omitted AWS defaults it to AdministratorAccess.
 * So we pin both the role and the guardrail to CloudWatch read-only: the worst
 * anyone can do from this channel is read CloudWatch.
 */
function setupSlack(
  namePrefix: string,
  snsTopicArn: pulumi.Input<string>,
  slackWorkspaceId: string,
  slackChannelId: string,
) {
  // The role AWS Chatbot assumes on behalf of the channel (to render alarm
  // detail and to run any commands members type). The trust policy allows
  // only the Chatbot service principal to assume it.
  const chatbotRole = new aws.iam.Role(`${namePrefix}-chatbot-role`, {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: 'chatbot.amazonaws.com' },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
  });
  // The role's baseline permissions.
  new aws.iam.RolePolicyAttachment(`${namePrefix}-chatbot-cw-read`, {
    role: chatbotRole.name,
    policyArn: CLOUDWATCH_READ_ONLY,
  });
  new aws.chatbot.SlackChannelConfiguration(`${namePrefix}-slack`, {
    configurationName: `${namePrefix}-alerts`,
    iamRoleArn: chatbotRole.arn,
    // Slack workspace (team) and channel the messages are posted to.
    slackTeamId: slackWorkspaceId,
    slackChannelId,
    // Topics whose messages Chatbot relays into the channel.
    snsTopicArns: [snsTopicArn],
    // Hard ceiling on channel-initiated actions. Set explicitly because the
    // default when unset is AdministratorAccess.
    guardrailPolicyArns: [CLOUDWATCH_READ_ONLY],
    // How verbosely Chatbot logs its own activity to CloudWatch Logs.
    loggingLevel: 'ERROR',
  });
}

import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import * as studion from '@studion/infra-code-blocks';

import { getEnvVariables, getSecrets, getSsmKey } from './env';
import { setupMonitoring } from './monitoring';

const config = new pulumi.Config();
const dnsConfig = new pulumi.Config('dns');

const PROJECT_NAME = pulumi.getProject();
const STACK_NAME = pulumi.getStack();
const projectPrefix = `${PROJECT_NAME}-${STACK_NAME}`;

function buildAndPushImage() {
  const imageRepository = new aws.ecr.Repository('tailor-cms', {
    forceDelete: true,
  });
  return new awsx.ecr.Image('author', {
    repositoryUrl: imageRepository.repositoryUrl,
    context: '..',
    platform: 'linux/amd64',
    imageTag: `author-${STACK_NAME}-latest`,
    args: {
      ssh: 'default',
    },
  });
}

export const authorImage =
  process.env.TAILOR_DOCKER_IMAGE || buildAndPushImage().imageUri;

const vpc = new awsx.ec2.Vpc(`${projectPrefix}-vpc`, {
  enableDnsHostnames: true,
  numberOfAvailabilityZones: 2,
  natGateways: { strategy: 'None' },
  subnetStrategy: 'Auto',
  subnetSpecs: [
    { type: awsx.ec2.SubnetType.Public, cidrMask: 24 },
    { type: awsx.ec2.SubnetType.Private, cidrMask: 24 },
    { type: awsx.ec2.SubnetType.Isolated, cidrMask: 24 },
  ],
});

const dbPasswordParam = aws.ssm.getParameterOutput({
  name: getSsmKey('DB_PASSWORD'),
  withDecryption: true,
});

// Prefixed by project to promote reuse within ecosystem.
// `protect` makes Pulumi refuse any operation that would delete or replace the
// database
const db = new studion.Database(
  `${projectPrefix}-db`,
  {
    instanceClass: 'db.t4g.small',
    username: 'tailor_cms',
    password: dbPasswordParam.value,
    dbName: 'author',
    vpc,
    engineVersion: '17.6',
    enableMonitoring: false,
  },
  { protect: true },
);

const cluster = new aws.ecs.Cluster(`${projectPrefix}-ecs-cluster`, {
  name: `${projectPrefix}-ecs-cluster`,
});

const webServer = new studion.WebServer(
  `${config.require('resourceNamePrefix')}-${STACK_NAME}-be`,
  {
    image: authorImage,
    port: 3000,
    domain: dnsConfig.require('domain'),
    vpc,
    cluster,
    hostedZoneId: dnsConfig.require('hostedZoneId'),
    autoscaling: { enabled: false },
    size: 'large', // 1 vCPU, 2GB RAM
    desiredCount: 1,
    healthCheckPath: '/api/healthcheck',
    environment: getEnvVariables(db),
    secrets: getSecrets(db),
  },
);

// Reporting: CloudWatch + Route 53 alarms -> SNS -> email/Slack.
//   - email:  ALERT_EMAIL env var, or the `alerts:email` stack config.
//   - Slack:  `alerts:slackWorkspaceId` + `alerts:slackChannelId` (both),
//             via AWS Chatbot, after the one-time console workspace auth.
const alertsConfig = new pulumi.Config('alerts');
const alertEmail = process.env.ALERT_EMAIL ?? alertsConfig.get('email');
const slackWorkspaceId = alertsConfig.get('slackWorkspaceId');
const slackChannelId = alertsConfig.get('slackChannelId');

// Only provision monitoring when there's somewhere to send alerts;
// to avoid additional costs
const hasAlertChannel =
  Boolean(alertEmail) || Boolean(slackWorkspaceId && slackChannelId);

const monitoring = hasAlertChannel
  ? setupMonitoring({
      namePrefix: `${config.require('resourceNamePrefix')}-${STACK_NAME}`,
      domain: dnsConfig.require('domain'),
      db,
      webServer,
      alertEmail,
      slackWorkspaceId,
      slackChannelId,
    })
  : undefined;

export const vpcId = vpc.vpcId;
export const vpcCidrBlock = vpc.vpc.cidrBlock;
export const vpcPublicSubnetIds = vpc.publicSubnetIds;
export const vpcPrivateSubnetIds = vpc.privateSubnetIds;
export const vpcIsolatedSubnetIds = vpc.isolatedSubnetIds;
export const ecsCluserId = cluster.id;
export const ecsCluserName = cluster.name;
export const dbEndpoint = db.instance.address;
export const dbPort = db.instance.port.apply((port: number) => String(port));
export const dbName = db.instance.dbName;
export const dbUser = db.instance.username;

// Monitoring outputs (undefined on stacks with no alert channel configured).
export const monitoringEnabled = hasAlertChannel;
export const alertsTopicArn = monitoring?.snsTopic.arn;

# Infrastructure

Pulumi provisions the production AWS stack for Tailor CMS.
It builds on top of [`@studion/infra-code-blocks`][icb] for main
components (`Database`, `WebServer`) and hand-rolls the rest (VPC, ECS cluster,
monitoring).

[icb]: https://github.com/ExtensionEngine/infra-code-blocks

## What it provisions

- **VPC** — `awsx.ec2.Vpc`, 2 AZs, public/private/isolated subnets, **no NAT
  gateways** (`natGateways.strategy: 'None'`) to keep cost down. NAT is only
  needed if the app task moves into private subnets and still needs outbound to
  external APIs (OpenAI, SMTP, etc.); today it runs in public subnets with a
  public IP, and RDS sits in isolated subnets that need no internet.
- **Database** — `studion.Database`, RDS PostgreSQL `17.6` (`db.t4g.small`) in
  the isolated subnets, password sourced from SSM Parameter Store.
- **ECS cluster + WebServer** — `studion.WebServer` runs a single Fargate task
  (`size: large`, `desiredCount: 1`, autoscaling off) behind an ALB with ACM
  TLS and a Route 53 alias on the configured domain. ALB target health check is
  the shallow `/api/healthcheck`.
- **Monitoring** (`monitoring.ts`, opt-in) — CloudWatch alarms (ALB unhealthy
  hosts, ALB 5xx, RDS CPU/storage, and an outside-in Route 53 check on the deep
  `/api/health/ready`) fan into an SNS topic delivering to email and/or Slack
  (via AWS Chatbot). Only created when an alert channel is configured.

Env/secret wiring for the service lives in `src/env.ts`: plaintext values via
`getEnvVariables`, secrets resolved from SSM parameter ARNs via `getSecrets`.

## Configuration

- Stack config: `Pulumi.prod.yaml` (domain, hosted zone, S3, OIDC, AI, consumer,
  discovery, alert channel, etc.).
- Secrets: AWS SSM Parameter Store under the `ssm:keyPrefix` (`author/prod`),
  plus the RDS-managed `DB_PASSWORD` parameter. See `getSecrets` for the list.

## Local usage

The Pulumi CLI is not required for type-checking, but is for preview/up.

```bash
# Preview / apply (needs Pulumi CLI + login + AWS creds)
pulumi login
export PULUMI_ACCESS_TOKEN=...      # or `pulumi login` interactively
# AWS credentials via env/profile, region from Pulumi.prod.yaml (aws:region)
pnpm --filter @tailor-cms/infrastucture preview
pnpm --filter @tailor-cms/infrastucture up
```

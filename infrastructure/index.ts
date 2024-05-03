import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import * as studion from '@studion/infra-code-blocks';

import { secrets } from './env';

const config = new pulumi.Config();
const dnsConfig = new pulumi.Config('dns');

const PROJECT_NAME = pulumi.getProject();
const STACK = pulumi.getStack();

const resourceNamePrefix = config.require('resourceNamePrefix');
const fullPrefix = `${resourceNamePrefix}-${STACK}`;

export const serverImage = process.env.SERVER_IMAGE;
if (!serverImage) throw new Error('Server image env is required');

const vpc = new awsx.ec2.Vpc(`${PROJECT_NAME}-vpc`, {
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

const db = new studion.Database(`${fullPrefix}-tailor-db`, {
  instanceClass: 'db.t4g.micro',
  dbName: 'tailor_cms',
  username: 'tailor_cms',
  vpcId: vpc.vpcId,
  vpcCidrBlock: vpc.vpc.cidrBlock,
  isolatedSubnetIds: vpc.publicSubnetIds,
});

const cluster = new aws.ecs.Cluster(`${fullPrefix}-ecs-cluster`, {
  name: `${fullPrefix}-ecs-cluster`,
});

const webServer = new studion.WebServer(`${fullPrefix}-server`, {
  image: serverImage,
  port: 3000,
  domain: dnsConfig.require('domain'),
  vpcId: vpc.vpcId,
  vpcCidrBlock: vpc.vpc.cidrBlock,
  publicSubnetIds: vpc.publicSubnetIds,
  clusterId: cluster.id,
  clusterName: cluster.name,
  hostedZoneId: dnsConfig.require('hostedZoneId'),
  autoscaling: { enabled: false },
  size: 'small',
  desiredCount: 1,
  healthCheckPath: '/healthcheck',
  environment: [
    { name: 'NODE_ENV', value: 'development' },
    { name: 'HOSTNAME', value: 'tailor-cms.com' },
    { name: 'PROTOCOL', value: 'https' },
    { name: 'PORT', value: '3000' },
    { name: 'REVERSE_PROXY_PORT', value: '443' },
    { name: 'CORS_ALLOWED_ORIGINS', value: 'https://tailor-cms.com' },
    { name: 'DATABASE_USER', value: db.instance.username },
    { name: 'DATABASE_NAME', value: db.instance.dbName },
    { name: 'DATABASE_HOST', value: db.instance.address },
    {
      name: 'DATABASE_PORT',
      value: db.instance.port.apply((port: number) => String(port)),
    },
    { name: 'DATABASE_ADAPTER', value: 'postgres' },
    { name: 'DATABASE_SSL', value: 'true' },
    { name: 'STORAGE_PROVIDER', value: 'amazon' },
    { name: 'STORAGE_REGION', value: 'eu-central-1' },
    { name: 'STORAGE_BUCKET', value: 'tailor-cms-dev' },
    { name: 'LOG_LEVEL', value: 'DEBUG' },
    { name: 'AUTH_JWT_ISSUER', value: 'tailor' },
    { name: 'AUTH_JWT_COOKIE_NAME', value: 'access_token' },
    { name: 'AUTH_SALT_ROUNDS', value: '10' },
    { name: 'NUXT_PUBLIC_AI_UI_ENABLED', value: 'true' },
    { name: 'EMAIL_SENDER_NAME', value: 'Tailor' },
    { name: 'EMAIL_HOST', value: 'email-smtp.us-east-1.amazonaws.com' },
    { name: 'EMAIL_SSL', value: '1' },
    { name: 'AI_MODEL_ID', value: 'gpt-4-0125-preview' },
    { name: 'FLAT_REPO_STRUCTURE', value: '1' },
  ],
  secrets: [
    ...secrets,
    { name: 'DATABASE_PASSWORD', valueFrom: db.password.secret.arn },
  ],
});

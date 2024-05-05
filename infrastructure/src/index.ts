import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import * as studion from '@studion/infra-code-blocks';

import { getEnvVariables, getSecrets } from './env';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  environment: getEnvVariables(db),
  secrets: getSecrets(db),
});

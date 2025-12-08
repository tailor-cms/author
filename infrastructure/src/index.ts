import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import * as studion from '@studion/infra-code-blocks';

import { getEnvVariables, getSecrets, getSsmKey } from './env';

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

// Prefixed by project to promote reuse within ecosystem
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

// Prefixed by project to promote reuse within ecosystem
const db = new studion.Database(`${projectPrefix}-db`, {
  instanceClass: 'db.t4g.small',
  username: 'tailor_cms',
  password: dbPasswordParam.value,
  dbName: 'author',
  vpcId: vpc.vpcId,
  vpcCidrBlock: vpc.vpc.cidrBlock,
  isolatedSubnetIds: vpc.isolatedSubnetIds,
  engineVersion: '17.6',
  enableMonitoring: false,
});

const cluster = new aws.ecs.Cluster(`${projectPrefix}-ecs-cluster`, {
  name: `${projectPrefix}-ecs-cluster`,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const webServer = new studion.WebServer(
  `${config.require('resourceNamePrefix')}-${STACK_NAME}-be`,
  {
    image: authorImage,
    port: 3000,
    domain: dnsConfig.require('domain'),
    vpcId: vpc.vpcId,
    vpcCidrBlock: vpc.vpc.cidrBlock,
    publicSubnetIds: vpc.publicSubnetIds,
    clusterId: cluster.id,
    clusterName: cluster.name,
    hostedZoneId: dnsConfig.require('hostedZoneId'),
    autoscaling: { enabled: false },
    size: 'large', // 1 vCPU, 2GB RAM
    desiredCount: 1,
    healthCheckPath: '/api/healthcheck',
    environment: getEnvVariables(db),
    secrets: getSecrets(db),
  },
);

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

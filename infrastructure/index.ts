import * as pulumi from '@pulumi/pulumi';
import * as studion from '@studion/infra-code-blocks';

import { secrets } from './env';

const config = new pulumi.Config();
const awsConfig = new pulumi.Config('aws');

const org = config.require('pulumi-org');
const name = pulumi.getProject();
const stack = pulumi.getStack();
const domain = config.require('baseDomain');
const hostedZoneId = awsConfig.require('hostedZoneId');
const namePrefix = awsConfig.require('namePrefix');
const isProduction = stack === 'prod';

export const serverImage = process.env.SERVER_IMAGE;
if (!serverImage) throw new Error('Server image env is required');

// Self reference to get outputs from the stack created by the
// higher level abstractions like studion.Database
const stackRef = new pulumi.StackReference(`${org}/${name}/${stack}`);
const db = new studion.Database(`${namePrefix}-tailor-cms-db-${stack}`, {
  vpcId: stackRef.getOutput('vpcId'),
  isolatedSubnetIds: stackRef.getOutput('isolatedSubnetIds'),
  vpcCidrBlock: stackRef.getOutput('vpcCidrBlock'),
  dbName: 'tailor_cms',
  username: 'tailor_cms',
  instanceClass: 'db.t4g.micro',
});

const webServer = new studion.WebServer(`${namePrefix}-tailor-cms-${stack}`, {
  image: serverImage,
  port: 3000,
  domain,
  vpcId: stackRef.getOutput('vpcId'),
  vpcCidrBlock: stackRef.getOutput('vpcCidrBlock'),
  publicSubnetIds: stackRef.getOutput('publicSubnetIds'),
  clusterId: stackRef.getOutput('clusterId'),
  clusterName: stackRef.getOutput('clusterName'),
  hostedZoneId,
  autoscaling: { enabled: false },
  size: isProduction ? 'medium' : 'small',
  desiredCount: 1,
  healthCheckPath: '/healthcheck',
  environment: [
    { name: 'PORT', value: '3000' },
    { name: 'STORAGE_BUCKET', value: stackRef.getOutput('bucketName') },
    { name: 'DATABASE_NAME', value: db.instance.dbName },
    { name: 'DATABASE_USER', value: db.instance.username },
    { name: 'DATABASE_HOST', value: db.instance.address },
    {
      name: 'DATABASE_PORT',
      value: db.instance.port.apply((port) => String(port)),
    },
  ],
  secrets: [
    ...secrets,
    { name: 'DATABASE_PASSWORD', valueFrom: db.password.secret.arn },
  ],
});

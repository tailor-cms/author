import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const awsConfig = new pulumi.Config('aws');
const ssmConfig = new pulumi.Config('ssm');

function getSecret(key: string) {
  const accountId = config.getSecret('accountId');
  const region = awsConfig.require('region');
  const ssmKeyPrefix = ssmConfig.require('keyPrefix');
  return pulumi.interpolate`arn:aws:ssm:${region}:${accountId}:parameter/${ssmKeyPrefix}/${key}`;
}

const serverSecrets = [
  'AUTH_JWT_SECRET',
  'AUTH_JWT_COOKIE_SECRET',
  'STORAGE_KEY',
  'STORAGE_SECRET',
  'EMAIL_PASSWORD',
  'EMAIL_USER',
  'AI_SECRET_KEY',
];

export const secrets = serverSecrets.map((it) => ({
  name: it,
  valueFrom: getSecret(it),
}));

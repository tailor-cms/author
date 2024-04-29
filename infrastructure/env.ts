import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('aws');

const getSecret(key: string) {
  const region = config.require('region');
  const accountId = config.require('accountId');
  const ssmNamePrefix = config.require('ssmNamePrefix');
  return `arn:aws:ssm:${region}:${accountId}:parameter/${ssmNamePrefix}/${key}`;
}

const serverSecrets = [
  'AUTH_JWT_SECRET',
  'AUTH_JWT_COOKIE_SECRET',
  'AI_SECRET_KEY',
  'STORAGE_KEY',
  'STORAGE_SECRET',
  'EMAIL_PASSWORD',
  'EMAIL_USER',
];

export const secrets = serverSecrets.map(it => ({
  name: it,
  valueFrom: getSecret(it),
}));

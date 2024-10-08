import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as studion from '@studion/infra-code-blocks';

const aiConfig = new pulumi.Config('ai');
const schemaConfig = new pulumi.Config('schema');
const awsConfig = new pulumi.Config('aws');
const emailConfig = new pulumi.Config('email');
const dnsConfig = new pulumi.Config('dns');
const s3Config = new pulumi.Config('s3');
const ssmConfig = new pulumi.Config('ssm');
const accountId = aws.getCallerIdentityOutput().accountId;

function getSsmParam(key: string) {
  const region = awsConfig.require('region');
  const prefix = ssmConfig.require('keyPrefix');
  const baseArn = `arn:aws:ssm:${region}`;
  return pulumi.interpolate`${baseArn}:${accountId}:parameter/${prefix}/${key}`;
}

export const getEnvVariables = (db: studion.Database) => [
  // Will trigger DB migrations on startup
  { name: 'NODE_ENV', value: 'development' },
  { name: 'LOG_LEVEL', value: 'INFO' },
  { name: 'HOSTNAME', value: dnsConfig.require('domain') },
  { name: 'PROTOCOL', value: 'https' },
  // Internal service port
  { name: 'PORT', value: '3000' },
  // Outward facing port
  { name: 'REVERSE_PROXY_PORT', value: '443' },
  {
    name: 'CORS_ALLOWED_ORIGINS',
    value: `https://${dnsConfig.require('domain')}`,
  },
  { name: 'DATABASE_HOST', value: db.instance.address },
  {
    name: 'DATABASE_PORT',
    value: db.instance.port.apply((port: number) => String(port)),
  },
  { name: 'DATABASE_SSL', value: 'true' },
  { name: 'DATABASE_USER', value: db.instance.username },
  { name: 'DATABASE_NAME', value: db.instance.dbName },
  { name: 'DATABASE_ADAPTER', value: 'postgres' },
  { name: 'STORAGE_PROVIDER', value: 'amazon' },
  { name: 'STORAGE_REGION', value: s3Config.require('region') },
  // Create a bucket in the AWS console and set the name here
  { name: 'STORAGE_BUCKET', value: s3Config.require('bucket') },
  { name: 'AUTH_JWT_ISSUER', value: 'tailor' },
  { name: 'AUTH_JWT_COOKIE_NAME', value: 'access_token' },
  { name: 'AUTH_SALT_ROUNDS', value: '10' },
  { name: 'EMAIL_HOST', value: emailConfig.require('host') },
  { name: 'EMAIL_SSL', value: 'true' },
  { name: 'EMAIL_SENDER_NAME', value: 'Tailor' },
  { name: 'EMAIL_SENDER_ADDRESS', value: emailConfig.require('senderAddress') },
  { name: 'AI_MODEL_ID', value: aiConfig.require('modelId') },
  { name: 'NUXT_PUBLIC_AI_UI_ENABLED', value: 'true' },
  { name: 'FLAT_REPO_STRUCTURE', value: 'true' },
  {
    name: 'NUXT_PUBLIC_AVAILABLE_SCHEMAS',
    value: schemaConfig.require('availableSchemas'),
  },
];

export const getSecrets = (db: studion.Database) => [
  ...[
    'AUTH_JWT_SECRET',
    'AUTH_JWT_COOKIE_SECRET',
    'STORAGE_KEY',
    'STORAGE_SECRET',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'AI_SECRET_KEY',
  ].map((name) => ({ name, valueFrom: getSsmParam(name) })),
  { name: 'DATABASE_PASSWORD', valueFrom: db.password.secret.arn },
];

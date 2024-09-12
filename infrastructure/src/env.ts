import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as studion from '@studion/infra-code-blocks';

const aiConfig = new pulumi.Config('ai');
const oidcConfg = new pulumi.Config('oidc');
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
  { name: 'FLAT_REPO_STRUCTURE', value: 'true' },
  { name: 'NUXT_PUBLIC_OIDC_ENABLED', value: oidcConfg.require('enabled') },
  {
    name: 'NUXT_PUBLIC_OIDC_LOGIN_TEXT',
    value: oidcConfg.require('loginText'),
  },
  { name: 'OIDC_ISSUER', value: oidcConfg.require('issuer') },
  { name: 'OIDC_JWKS_URL', value: oidcConfg.require('jwksUrl') },
  {
    name: 'OIDC_AUTHORIZATION_ENDPOINT',
    value: oidcConfg.require('authorizationEndpoint'),
  },
  { name: 'OIDC_TOKEN_ENDPOINT', value: oidcConfg.require('tokenEndpoint') },
  {
    name: 'OIDC_USERINFO_ENDPOINT',
    value: oidcConfg.require('userinfoEndpoint'),
  },
  {
    name: 'NUXT_PUBLIC_OIDC_LOGOUT_ENABLED',
    value: oidcConfg.require('logoutEnabled'),
  },
  { name: 'OIDC_LOGOUT_ENDPOINT', value: oidcConfg.require('logoutEndpoint') },
  {
    name: 'OIDC_POST_LOGOUT_URI_KEY',
    value: oidcConfg.require('postLogoutUriKey'),
  },
  { name: 'OIDC_ALLOW_SIGNUP', value: 'true' },
  { name: 'OIDC_DEFAULT_ROLE', value: 'ADMIN' },
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
    'OIDC_CLIENT_ID',
    'OIDC_CLIENT_SECRET',
    'SESSION_SECRET',
  ].map((name) => ({ name, valueFrom: getSsmParam(name) })),
  { name: 'DATABASE_PASSWORD', valueFrom: db.password.secret.arn },
];

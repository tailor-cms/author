import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import type * as studion from '@studion/infra-code-blocks';

const aiConfig = new pulumi.Config('ai');
const awsConfig = new pulumi.Config('aws');
const dnsConfig = new pulumi.Config('dns');
const emailConfig = new pulumi.Config('email');
const oidcConfg = new pulumi.Config('oidc');
const s3Config = new pulumi.Config('s3');
const schemaConfig = new pulumi.Config('schema');
const ssmConfig = new pulumi.Config('ssm');
const statsigConfig = new pulumi.Config('statsig');

const accountId = aws.getCallerIdentityOutput().accountId;

function getSsmParam(key: string) {
  const region = awsConfig.require('region');
  const prefix = ssmConfig.require('keyPrefix');
  const baseArn = `arn:aws:ssm:${region}`;
  return pulumi.interpolate`${baseArn}:${accountId}:parameter/${prefix}/${key}`;
}

export const getEnvVariables = (db: studion.Database): any => [
  { name: 'LOG_LEVEL', value: 'info' },
  { name: 'HOSTNAME', value: dnsConfig.require('domain') },
  { name: 'PROTOCOL', value: 'https' },
  { name: 'PORT', value: '3000' }, // Internal service port
  { name: 'REVERSE_PROXY_PORT', value: '443' }, // Outward facing port
  {
    name: 'CORS_ALLOWED_ORIGINS',
    value: `https://${dnsConfig.require('domain')}`,
  },
  { name: 'DATABASE_USER', value: db.instance.username },
  { name: 'DATABASE_NAME', value: db.instance.dbName },
  { name: 'DATABASE_ADAPTER', value: 'postgres' },
  { name: 'DATABASE_SSL', value: 'true' },
  { name: 'DATABASE_HOST', value: db.instance.address },
  {
    name: 'DATABASE_PORT',
    value: db.instance.port.apply((port: number) => String(port)),
  },
  { name: 'STORAGE_PROVIDER', value: 'amazon' },
  { name: 'STORAGE_REGION', value: s3Config.require('region') },
  { name: 'STORAGE_BUCKET', value: s3Config.require('bucket') },
  { name: 'AUTH_JWT_ISSUER', value: 'tailor' },
  { name: 'AUTH_JWT_COOKIE_NAME', value: 'access_token' },
  { name: 'AUTH_SALT_ROUNDS', value: '10' },
  { name: 'EMAIL_HOST', value: emailConfig.require('host') },
  { name: 'EMAIL_SSL', value: 'true' },
  { name: 'EMAIL_SENDER_NAME', value: 'Tailor' },
  {
    name: 'EMAIL_SENDER_ADDRESS',
    value: emailConfig.require('senderAddress'),
  },
  { name: 'FLAT_REPO_STRUCTURE', value: 'true' },
  {
    name: 'NUXT_PUBLIC_AVAILABLE_SCHEMAS',
    value: schemaConfig.get('availableSchemas'),
  },
  ...getAiConfig(),
  ...getOidcConfig(),
];

export const getSecrets = (db: studion.Database) => {
  const ssmParams = [
    'AUTH_JWT_SECRET',
    'AUTH_JWT_COOKIE_SECRET',
    'STORAGE_KEY',
    'STORAGE_SECRET',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'TCE_MUX_TOKEN_ID',
    'TCE_MUX_TOKEN_SECRET',
    'TCE_MUX_JWT_SIGNING_KEY',
    'TCE_MUX_JWT_PRIVATE_KEY',
  ];
  if (aiConfig.getBoolean('enabled')) ssmParams.push('AI_SECRET_KEY');
  if (statsigConfig.getBoolean('enabled'))
    ssmParams.push('NUXT_PUBLIC_STATSIG_KEY');
  if (oidcConfg.getBoolean('enabled'))
    ssmParams.push(
      'OIDC_CLIENT_ID',
      'OIDC_CLIENT_SECRET',
      'OIDC_SESSION_SECRET',
    );
  return [
    ...ssmParams.map((name) => ({ name, valueFrom: getSsmParam(name) })),
    { name: 'DATABASE_PASSWORD', valueFrom: db.password.secret.arn },
  ];
};

function getOidcConfig() {
  if (!oidcConfg.getBoolean('enabled')) return [];
  return [
    { name: 'NUXT_PUBLIC_OIDC_ENABLED', value: 'true' },
    {
      name: 'NUXT_PUBLIC_OIDC_LOGIN_TEXT',
      value: oidcConfg.require('loginText'),
    },
    {
      name: 'NUXT_PUBLIC_OIDC_LOGOUT_ENABLED',
      value: oidcConfg.get('logoutEnabled'),
    },
    { name: 'OIDC_ALLOW_SIGNUP', value: oidcConfg.require('allowSignup') },
    {
      name: 'OIDC_AUTHORIZATION_ENDPOINT',
      value: oidcConfg.require('authorizationEndpoint'),
    },
    { name: 'OIDC_DEFAULT_ROLE', value: oidcConfg.require('defaultRole') },
    { name: 'OIDC_ISSUER', value: oidcConfg.require('issuer') },
    { name: 'OIDC_JWKS_URL', value: oidcConfg.require('jwksUrl') },
    {
      name: 'OIDC_LOGOUT_ENDPOINT',
      value: oidcConfg.get('logoutEndpoint'),
    },
    {
      name: 'OIDC_POST_LOGOUT_URI_KEY',
      value: oidcConfg.get('postLogoutUriKey'),
    },
    {
      name: 'OIDC_TOKEN_ENDPOINT',
      value: oidcConfg.require('tokenEndpoint'),
    },
    {
      name: 'OIDC_USERINFO_ENDPOINT',
      value: oidcConfg.require('userinfoEndpoint'),
    },
  ];
}

function getAiConfig() {
  if (!aiConfig.getBoolean('enabled')) return [];
  return [
    { name: 'NUXT_PUBLIC_AI_UI_ENABLED', value: 'true' },
    { name: 'AI_MODEL_ID', value: aiConfig.get('modelId') },
  ];
}

const { env } = process;

export const previewWebhookUrl: string | undefined =
  env.CONSUMER_PREVIEW_WEBHOOK || env.PREVIEW_URL;

export const publishWebhookUrl: string | undefined =
  env.CONSUMER_PUBLISH_WEBHOOK || env.CONSUMER_WEBHOOK_URL;

export const publishWebhookThrottle: number = env.CONSUMER_PUBLISH_WEBHOOK_THROTTLE
  ? parseInt(env.CONSUMER_PUBLISH_WEBHOOK_THROTTLE, 10)
  : 0;

export const accessUpdateWebhookUrl: string | undefined =
  env.CONSUMER_ACCESS_UPDATE_WEBHOOK;

export const clientId: string | undefined = env.CONSUMER_CLIENT_ID;

export const clientSecret: string | undefined = env.CONSUMER_CLIENT_SECRET;

export const tokenHost: string | undefined = env.CONSUMER_CLIENT_TOKEN_HOST;

export const tokenPath: string | undefined = env.CONSUMER_CLIENT_TOKEN_PATH;

export const isAuthConfigured: boolean = !!(
  clientId &&
  clientSecret &&
  tokenHost &&
  tokenPath
);

export default {
  previewWebhookUrl,
  publishWebhookUrl,
  publishWebhookThrottle,
  accessUpdateWebhookUrl,
  clientId,
  clientSecret,
  isAuthConfigured,
  tokenHost,
  tokenPath,
};

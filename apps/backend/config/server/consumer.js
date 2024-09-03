const { env } = process;

export const previewWebhookUrl =
  env.CONSUMER_PREVIEW_WEBHOOK || env.PREVIEW_URL;

export const publishWebhookUrl =
  env.CONSUMER_PUBLISH_WEBHOOK || env.CONSUMER_WEBHOOK_URL;

export const publishWebhookThrottle = env.CONSUMER_PUBLISH_WEBHOOK_THROTTLE
  ? parseInt(env.CONSUMER_PUBLISH_WEBHOOK_THROTTLE, 10)
  : 0;

export const clientId = env.CONSUMER_CLIENT_ID;

export const clientSecret = env.CONSUMER_CLIENT_SECRET;

export const tokenHost = env.CONSUMER_CLIENT_TOKEN_HOST;

export const tokenPath = env.CONSUMER_CLIENT_TOKEN_PATH;

export const isAuthConfigured =
  clientId && clientSecret && tokenHost && tokenPath;

export default {
  previewWebhookUrl,
  publishWebhookUrl,
  publishWebhookThrottle,
  clientId,
  clientSecret,
  isAuthConfigured,
  tokenHost,
  tokenPath,
};

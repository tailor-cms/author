import { env } from './env.ts';

export const previewWebhookUrl = env.CONSUMER_PREVIEW_WEBHOOK;

export const publishWebhookUrl = env.CONSUMER_PUBLISH_WEBHOOK;

export const publishWebhookThrottle = env.CONSUMER_PUBLISH_WEBHOOK_THROTTLE;

export const accessUpdateWebhookUrl = env.CONSUMER_ACCESS_UPDATE_WEBHOOK;

export const clientId = env.CONSUMER_CLIENT_ID;
export const clientSecret = env.CONSUMER_CLIENT_SECRET;
export const tokenHost = env.CONSUMER_CLIENT_TOKEN_HOST;
export const tokenPath = env.CONSUMER_CLIENT_TOKEN_PATH;

export const isAuthConfigured = !!(
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

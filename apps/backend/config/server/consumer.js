import yn from 'yn';

const { env } = process;

export const previewWebhookUrl =
  env.CONSUMER_PREVIEW_WEBHOOK || env.PREVIEW_URL;

// Publish working version of entire repository to preview environment
export const enableDraftPublishing = yn(env.PUBLISH_DRAFT_TO_PREVIEW_ENV);

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
  enableDraftPublishing,
  publishWebhookThrottle,
  clientId,
  clientSecret,
  isAuthConfigured,
  tokenHost,
  tokenPath,
};

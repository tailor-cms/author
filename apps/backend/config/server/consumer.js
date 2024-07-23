const { env } = process;

export const webhookUrl = env.CONSUMER_WEBHOOK_URL;

export const clientId = env.CONSUMER_CLIENT_ID;

export const clientSecret = env.CONSUMER_CLIENT_SECRET;

export const tokenHost = env.CONSUMER_CLIENT_TOKEN_HOST;

export const tokenPath = env.CONSUMER_CLIENT_TOKEN_PATH;

export const isConfigured =
  webhookUrl && clientId && clientSecret && tokenHost && tokenPath;

export default {
  webhookUrl,
  clientId,
  clientSecret,
  isConfigured,
  tokenHost,
  tokenPath,
};

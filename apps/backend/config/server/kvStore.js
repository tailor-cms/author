import KeyvRedis from '@keyv/redis';

export const providerUrl = process.env.KV_STORE_URL || undefined;
export const ttl = parseInt(process.env.KV_STORE_DEFAULT_TTL, 10) || 0;
export const store =
  providerUrl && providerUrl.startsWith('redis://')
    ? new KeyvRedis(providerUrl)
    : undefined;

export const keyvDefaultConfig = { ttl, ...(store && { store }) };

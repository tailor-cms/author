export const providerUrl = process.env.KV_STORE_URL || undefined;
export const ttl = parseInt(process.env.KV_STORE_DEFAULT_TTL, 10) || 0;

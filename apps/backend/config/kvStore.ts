import KeyvRedis from '@keyv/redis';
import { env } from './env.ts';

export const providerUrl = env.KV_STORE_URL;
export const ttl = env.KV_STORE_DEFAULT_TTL;

// Side-effect at import: opens a Redis connection when KV_STORE_URL is a
// redis:// or rediss:// URL (validated in env.ts). Falls back to
// in-memory Keyv otherwise.
export const store = providerUrl ? new KeyvRedis(providerUrl) : undefined;

export const keyvDefaultConfig = { ttl, ...(store && { store }) };

import {
  general as generalConfig,
  kvStore as kvStoreConfig,
} from '../../config/server/index.js';
import Keyv from 'keyv';
import rateLimit from 'express-rate-limit';

const DEFAULT_WINDOW_MS = 1 * 60 * 1000; // every minute

// Store must be implemented using the following interface:
// https://github.com/nfriedly/express-rate-limit/blob/master/README.md#store
class Store {
  constructor() {
    this.cache = new Keyv(kvStoreConfig.providerUrl, {
      namespace: 'request-limiter',
      ttl: kvStoreConfig.ttl,
    });
  }

  async incr(key, cb) {
    const initialState = { hits: 0 };
    const { hits, ...record } = (await this.cache.has(key))
      ? await this.cache.get(key)
      : initialState;
    await this.cache.set(key, { ...record, hits: hits + 1 });
    cb(null, hits);
  }

  async decrement(key) {
    const { hits, ...record } = (await this.cache.get(key)) || {};
    if (!hits) return;
    return this.cache.set(key, { ...record, hits: hits - 1 });
  }

  resetKey(key) {
    return this.cache.delete(key);
  }
}

const defaultStore = new Store();

function requestLimiter({
  limit = 30,
  windowMs = DEFAULT_WINDOW_MS,
  validate = false,
  store = defaultStore,
  ...opts
} = {}) {
  // 0 is counted as a hit, so we need to subtract
  const max = limit > 0 ? limit - 1 : 0;
  const options = { limit: max, validate, windowMs, store, ...opts };
  if (!generalConfig.enableRateLimiting) options.skip = () => true;
  return rateLimit(options);
}

export { requestLimiter };

import {
  general as generalConfig,
  store as storeConfig,
} from '../../config/server/index.js';
import rateLimit from 'express-rate-limit';
import Tapster from '@extensionengine/tapster';

const { provider, ...options } = storeConfig;
const DEFAULT_WINDOW_MS = 1 * 60 * 1000; // every minute

// Store must be implemented using the following interface:
// https://github.com/nfriedly/express-rate-limit/blob/master/README.md#store
class Store {
  constructor() {
    this.cache = new Tapster({
      ...options[provider],
      store: provider,
      namespace: 'request-limiter',
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

// As of version 7.0.0, setting max to zero will no longer disable the rate
// limiter - instead, it will ‘block’ all requests to that endpoint.
function requestLimiter({
  max = 30,
  windowMs = DEFAULT_WINDOW_MS,
  store = defaultStore,
  ...opts
} = {}) {
  if (!generalConfig.enableRateLimiting) max = 0;
  return rateLimit({ max, windowMs, store, ...opts });
}

export { requestLimiter };

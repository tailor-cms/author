import Keyv, { type KeyvOptions } from 'keyv';
import overArgs from 'lodash/overArgs.js';

import { kvStore } from '#config';

// keyv 5.x rejects non-string keys (calls key.startsWith internally).
// Callers commonly hold numeric ids (repositoryId, userId), so coerce
// at the boundary here instead of stringifying at every call site.
export function createKvStore<T = unknown>(options?: KeyvOptions): Keyv<T> {
  const cache = new Keyv<T>({ ...kvStore.keyvDefaultConfig, ...options });
  cache.set = overArgs(cache.set, [String]) as typeof cache.set;
  cache.get = overArgs(cache.get, [String]) as typeof cache.get;
  cache.has = overArgs(cache.has, [String]) as typeof cache.has;
  cache.delete = overArgs(cache.delete, [String]) as typeof cache.delete;
  return cache;
}

import resolveUrl from '@tailor-cms/common/src/url.js';

import * as ai from './ai.js';
import * as auth from './auth.js';
import * as consumer from './consumer.js';
import * as general from './general.js';
import * as mail from './mail.js';
import * as storage from './storage.js';
import * as kvStore from './kvStore.js';
import tce from './tce.js';
import * as test from './test.js';

const { hostname, protocol, port, origin } = resolveUrl(process.env);

export {
  ai,
  auth,
  consumer,
  general,
  hostname,
  kvStore,
  mail,
  origin,
  port,
  protocol,
  storage,
  tce,
  test,
};

export default {
  ai,
  auth,
  consumer,
  general,
  hostname,
  kvStore,
  mail,
  origin,
  port,
  protocol,
  storage,
  tce,
  test,
};

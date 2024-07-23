import * as ai from './ai.js';
import * as auth from './auth.js';
import * as consumer from './consumer.js';
import * as mail from './mail.js';
import * as storage from './storage.js';
import * as store from './store.js';
import * as tce from './tce.js';
import * as test from './test.js';

import resolveUrl from 'tailor-config-shared/src/url.js';

const { hostname, protocol, port, origin } = resolveUrl(process.env);

export {
  ai,
  auth,
  consumer,
  hostname,
  mail,
  origin,
  port,
  protocol,
  storage,
  store,
  tce,
  test,
};

export default {
  ai,
  auth,
  consumer,
  hostname,
  mail,
  origin,
  port,
  protocol,
  storage,
  store,
  tce,
  test,
};

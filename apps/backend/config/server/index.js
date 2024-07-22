import resolveUrl from 'tailor-config-shared/src/url.js';

import * as ai from './ai.js';
import * as auth from './auth.js';
import * as consumer from './consumer.js';
import * as general from './general.js';
import * as mail from './mail.js';
import * as storage from './storage.js';
import * as store from './store.js';
import * as tce from './tce.js';
import * as test from './test.js';

const { hostname, protocol, port, origin } = resolveUrl(process.env);

const previewUrl = process.env.PREVIEW_URL;

export {
  ai,
  auth,
  consumer,
  general,
  hostname,
  mail,
  origin,
  port,
  previewUrl,
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
  general,
  hostname,
  mail,
  origin,
  port,
  previewUrl,
  protocol,
  storage,
  store,
  tce,
  test,
};

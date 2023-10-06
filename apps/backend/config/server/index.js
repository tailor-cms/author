import * as auth from './auth.js';
import * as consumer from './consumer.js';
import * as mail from './mail.js';
import * as storage from './storage.js';
import * as store from './store.js';
import * as tce from './tce.js';

import resolveUrl from 'tailor-config-shared/src/url.js';

const { hostname, protocol, port, origin } = resolveUrl(process.env);
const previewUrl = process.env.PREVIEW_URL;

export {
  protocol,
  hostname,
  port,
  origin,
  auth,
  mail,
  storage,
  previewUrl,
  consumer,
  store,
  tce
};

export default {
  protocol,
  hostname,
  port,
  origin,
  auth,
  mail,
  storage,
  previewUrl,
  consumer,
  store,
  tce
};

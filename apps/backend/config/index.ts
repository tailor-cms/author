import resolveUrl from '@tailor-cms/common/src/url.js';

import * as ai from './ai.ts';
import * as auth from './auth.ts';
import * as consumer from './consumer.ts';
import * as discovery from './discovery.ts';
import * as general from './general.ts';
import * as mail from './mail.ts';
import * as storage from './storage.ts';
import * as kvStore from './kvStore.ts';
import * as runtime from './runtime.ts';
import tce from './tce.ts';
import * as test from './test.ts';

const env = process.env;
const packageName = env.npm_package_name;
const packageVersion = env.npm_package_version;

const { isProduction } = runtime;
const { hostname, protocol, port, origin } = resolveUrl(env);

export {
  packageName,
  packageVersion,
  isProduction,
  ai,
  auth,
  consumer,
  discovery,
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
  packageName,
  packageVersion,
  isProduction,
  ai,
  auth,
  consumer,
  discovery,
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

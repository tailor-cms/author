import resolveUrl from '@tailor-cms/common/src/url.js';

import * as ai from './ai.ts';
import * as auth from './auth.ts';
import * as consumer from './consumer.ts';
import * as discovery from './discovery.ts';
import { env, type Env } from './env.ts';
import * as general from './general.ts';
import * as kvStore from './kvStore.ts';
import * as mail from './mail.ts';
import { isProduction } from './runtime.ts';
import * as storage from './storage.ts';
import tce from './tce.ts';
import * as test from './test.ts';

export type { Env };

const packageName = process.env.npm_package_name;
const packageVersion = process.env.npm_package_version;

const { hostname, protocol, port, origin } = resolveUrl(process.env);

export {
  ai,
  auth,
  consumer,
  discovery,
  env,
  general,
  hostname,
  isProduction,
  kvStore,
  mail,
  origin,
  packageName,
  packageVersion,
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
  discovery,
  env,
  general,
  hostname,
  isProduction,
  kvStore,
  mail,
  origin,
  packageName,
  packageVersion,
  port,
  protocol,
  storage,
  tce,
  test,
};

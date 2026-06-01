import { SCHEMAS } from '@tailor-cms/config';
import intersection from 'lodash/intersection.js';
import map from 'lodash/map.js';
import yn from 'yn';

import { env } from './env.ts';

// Express `trust proxy` accepts a count, a boolean, or a string of
// trusted addresses. Pass through whatever flavour the operator set so
// the upstream interpretation matches Express's own coercion rules.
function parseProxyPolicy(
  policy: string | undefined,
): number | boolean | string | undefined {
  if (policy == null) return policy;
  // Numeric -> hop count. `Number` (not parseInt) is deliberate;
  const hops = Number(policy);
  if (Number.isInteger(hops)) return hops;
  // Otherwise a boolean (true/false/yes/no/...), or - when yn doesn't
  // recognise it - an IP-list/preset string passed straight to Express.
  return yn(policy) ?? policy;
}

function getAvailableSchemas(): string[] {
  const declared = (env.NUXT_PUBLIC_AVAILABLE_SCHEMAS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const all = map(SCHEMAS, 'id') as string[];
  if (!declared.length) return all;
  return intersection(declared, all);
}

export const isFlatPublishingStructure = env.FLAT_REPO_STRUCTURE;
export const enableRateLimiting = env.ENABLE_RATE_LIMITING;
export const reverseProxyPolicy = parseProxyPolicy(env.REVERSE_PROXY_TRUST);
export const aiUiEnabled = env.NUXT_PUBLIC_AI_UI_ENABLED;
export const availableSchemas = getAvailableSchemas();

// When enabled, SSRF protection allows requests to localhost and private
// IP ranges (127.x, 10.x, 192.168.x, etc.). Intended for local
// development where asset discovery or link imports may target local
// services.
export const allowPrivateUrls = env.ALLOW_PRIVATE_URLS;

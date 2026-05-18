import yn from 'yn';
import { SCHEMAS } from '@tailor-cms/config';
import map from 'lodash/map.js';
import intersection from 'lodash/intersection.js';

const env = process.env;

const getAvailableSchemas = (): string[] => {
  const availableSchemas = (env.NUXT_PUBLIC_AVAILABLE_SCHEMAS || '')
    .split(',')
    .filter(Boolean)
    .map((schema) => schema.trim());
  const schemas = map(SCHEMAS, 'id') as string[];
  if (!availableSchemas.length) return schemas;
  return intersection(availableSchemas, schemas);
};

function isNumeric(input: string): boolean {
  return !Number.isNaN(Number(input)) && !Number.isNaN(parseFloat(input));
}

// Express `trust proxy` accepts a count, a boolean, or a string of
// trusted addresses. Pass through whatever flavour the operator set so
// the upstream interpretation matches Express's own coercion rules.
function parseProxyPolicy(
  policy: string | undefined,
): number | boolean | string | undefined {
  if (policy == null) return policy;
  if (isNumeric(policy)) return parseInt(policy, 10);
  const parsedBoolean = yn(policy);
  if (parsedBoolean !== undefined) return parsedBoolean;
  return policy;
}

export const isFlatPublishingStructure = yn(env.FLAT_REPO_STRUCTURE);

export const enableRateLimiting = yn(env.ENABLE_RATE_LIMITING);
export const reverseProxyPolicy = parseProxyPolicy(env.REVERSE_PROXY_TRUST);

export const aiUiEnabled = yn(env.NUXT_PUBLIC_AI_UI_ENABLED);
export const availableSchemas: string[] = getAvailableSchemas();

// When enabled, SSRF protection allows requests to localhost and private
// IP ranges (127.x, 10.x, 192.168.x, etc.). Intended for local development
// where asset discovery or link imports may target local services.
export const allowPrivateUrls = yn(env.ALLOW_PRIVATE_URLS);

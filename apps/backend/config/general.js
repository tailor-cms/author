import yn from 'yn';
import { SCHEMAS } from '@tailor-cms/config';
import map from 'lodash/map.js';
import intersection from 'lodash/intersection.js';

const getAvailableSchemas = () => {
  const availableSchemas = (env.NUXT_PUBLIC_AVAILABLE_SCHEMAS || '')
    .split(',')
    .filter(Boolean)
    .map((schema) => schema.trim());
  const schemas = map(SCHEMAS, 'id');
  if (!availableSchemas.length) return schemas;
  return intersection(availableSchemas, schemas);
};

function isNumeric(input) {
  if (typeof input !== 'string') return false;
  return !isNaN(input) && !isNaN(parseFloat(input));
}

function parseProxyPolicy(policy) {
  if (isNumeric(policy)) return parseInt(policy, 10);
  const parsedBoolean = yn(policy);
  if (parsedBoolean !== undefined) return parsedBoolean;
  // If the policy is not a boolean or a number, return the original value
  return policy;
}

const env = process.env;

export const enableRateLimiting = yn(env.ENABLE_RATE_LIMITING);
export const reverseProxyPolicy = parseProxyPolicy(env.REVERSE_PROXY_TRUST);

export const aiUiEnabled = yn(env.NUXT_PUBLIC_AI_UI_ENABLED);
export const availableSchemas = getAvailableSchemas();

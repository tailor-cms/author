import { createLogger } from '#logger';
import { isFlatPublishingStructure } from '#config/general.js';

export const PublishEnv = {
  DRAFT: 'draft',
  DEFAULT: 'repository',
};

export function getBaseUrl(env, repositoryId, parentId) {
  return isFlatPublishingStructure
    ? `${env}/${repositoryId}`
    : `${env}/${repositoryId}/${parentId}`;
}

export const logger = createLogger('publishing');
export const log = (msg) => logger.info(msg.replace(/\n/g, ' '));

export function renameKey(obj, key, newKey) {
  obj[newKey] = obj[key];
  delete obj[key];
}

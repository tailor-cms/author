import { createLogger } from '#logger';

const { FLAT_REPO_STRUCTURE } = process.env;

export const PublishEnv = {
  DRAFT: 'draft',
  DEFAULT: 'repository',
};

export function getBaseUrl(env, repositoryId, parentId) {
  return FLAT_REPO_STRUCTURE
    ? `${env}/${repositoryId}`
    : `${env}/${repositoryId}/${parentId}`;
}

export const logger = createLogger('publishing');
export const log = (msg) => logger.info(msg.replace(/\n/g, ' '));

export function renameKey(obj, key, newKey) {
  obj[newKey] = obj[key];
  delete obj[key];
}

import { createLogger } from '#logger';

const { FLAT_REPO_STRUCTURE } = process.env;

export function getBaseUrl(repoId, parentId) {
  return FLAT_REPO_STRUCTURE
    ? `repository/${repoId}`
    : `repository/${repoId}/${parentId}`;
}

export const logger = createLogger('publishing');
export const log = (msg) => logger.info(msg.replace(/\n/g, ' '));

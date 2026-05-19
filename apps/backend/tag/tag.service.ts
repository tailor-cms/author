import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import type { ListQuery } from './tag.schema.ts';
import type { Tag } from './models/tag.model.js';
import type { User } from '../user/models/user.model.js';

const { Tag: TagModel } = db;

const logger = createLogger('tag:svc');

// Returns the tag catalog, optionally narrowed to what the current user
// can reach through their repository memberships.
export async function list(
  user: User,
  filters: ListQuery,
): Promise<Tag[]> {
  logger.debug(
    { userId: user.id, associated: !!filters.associated },
    'Listing tags',
  );
  if (filters.associated) return TagModel.getAssociated(user);
  return TagModel.findAll();
}

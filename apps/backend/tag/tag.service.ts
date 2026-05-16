import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import type { Tag } from './models/tag.model.js';
import type { User } from '../user/models/user.model.js';

const { Tag: TagModel } = db;

const logger = createLogger('tag:svc');

export interface ListFilters {
  // When true, returns only tags that are visible to the user through
  // their repository memberships (admins still see every tag with at
  // least one repository link). When false/undefined, returns every
  // tag row regardless of association.
  associated?: boolean;
}

// Returns the tag catalog, optionally narrowed to what the current user
// can reach through their repository memberships.
export async function list(
  user: User,
  filters: ListFilters,
): Promise<Tag[]> {
  logger.debug(
    { userId: user.id, associated: !!filters.associated },
    'Listing tags',
  );
  if (filters.associated) return TagModel.getAssociated(user);
  return TagModel.findAll();
}

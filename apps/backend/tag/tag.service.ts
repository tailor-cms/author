import { Op } from 'sequelize';
import { createLogger } from '#logger';
import { visibleRepositoryConditions } from '../repository/repository.service.ts';
import type { ListFilter } from './schemas/index.ts';
import type { Tag } from './models/tag.model.js';
import type { User } from '../user/models/user.model.js';
import db from '#shared/database/index.js';

const { Tag: TagModel, Repository } = db;

const logger = createLogger('tag:svc');

// Returns the tag catalog, optionally narrowed to what the current user can
// reach through their repositories. Non-admin scoping mirrors the repository
// list exactly (direct membership OR user-group access), so a tag surfaces in
// the filter only when at least one repository the user can see carries it.
// Admins see every tag that has at least one repository link.
export async function list(
  user: User,
  filters: ListFilter,
): Promise<Tag[]> {
  logger.debug(
    { userId: user.id, associated: !!filters.associated },
    'Listing tags',
  );
  if (!filters.associated) return TagModel.findAll();
  const where = user.isAdmin()
    ? undefined
    : { [Op.or]: visibleRepositoryConditions(user) };
  return TagModel.findAll({
    include: [
      {
        model: Repository,
        as: 'repositories',
        attributes: ['id'],
        where,
        required: true,
      },
    ],
  });
}

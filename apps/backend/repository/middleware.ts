import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';

const { Repository, UserGroup } = db;

// Param middleware: loads the Repository (with its UserGroups) onto req.
// Uses paranoid:false so soft-deleted repositories are still resolvable
// (needed by routes that operate on detached state, e.g. revisions).
export async function getRepository(
  req: any,
  _res: any,
  next: any,
  repositoryId: string,
) {
  const repository = await Repository.findByPk(repositoryId, {
    include: [{ model: UserGroup, required: false }],
    paranoid: false,
  });
  if (!repository) {
    throw createError(StatusCodes.NOT_FOUND, 'Not found');
  }
  req.repository = repository;
  next();
}

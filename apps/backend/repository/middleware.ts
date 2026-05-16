import { StatusCodes } from 'http-status-codes';
import { register as registerSchema } from '@tailor-cms/config';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import { syncSchemaSnapshot } from './lib/schema.ts';

const { Repository, UserGroup } = db;

// Param middleware: loads the Repository (with its UserGroups) onto req.
// Uses paranoid:false so soft-deleted repositories are still resolvable
// (needed by routes that operate on detached state, e.g. revisions).
//
// Two snapshot side-effects, both load-time so reads always see a
// schema that matches the current bundle:
//   1. Register `data.$$.schema.config` with `@tailor-cms/config` so
//      external schemas resolve through the standard `getSchema(id)` API
//      for the rest of this request.
//   2. Refresh the snapshot from the live registry if it has drifted
//      (no-op for external snapshots and when sha is already aligned).
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
    // `createError` returns Promise.reject(httpError); returning it lets
    // Express's async-middleware catch the rejection and route it to the
    // error handler with the right httpError instance
    return createError(StatusCodes.NOT_FOUND, 'Not found');
  }
  const snapshotConfig = repository.data?.$$?.schema?.config;
  if (snapshotConfig) registerSchema(snapshotConfig);
  await syncSchemaSnapshot(repository);
  req.repository = repository;
  next();
}

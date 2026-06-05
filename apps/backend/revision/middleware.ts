import type { NextFunction, Response } from 'express';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import { StatusCodes } from 'http-status-codes';
import { USER_SUMMARY_ATTRS } from '#app/user/schemas/entity.ts';
import type { TimeTravelInput } from './schemas/index.ts';

const { Activity, Revision: RevisionModel, User } = db;

export async function getRevision(
  req: any,
  _res: Response,
  next: NextFunction,
  revisionId: string,
) {
  const id = Number.parseInt(revisionId, 10);
  if (!Number.isFinite(id)) {
    return createError(StatusCodes.NOT_FOUND, 'Revision not found');
  }
  const include = [{
    model: User,
    paranoid: false,
    attributes: USER_SUMMARY_ATTRS,
  }];
  const revision = await RevisionModel.fetch(id, { include });
  if (!revision || revision.repositoryId !== req.repository?.id) {
    return createError(StatusCodes.NOT_FOUND, 'Revision not found');
  }
  req.revision = revision;
  next();
}

export async function loadTargetActivity(
  req: any,
  _res: Response,
  next: NextFunction,
) {
  // `activityId` is a query param (not a path param) so we can't use
  // `router.param`. Mounted as `after` middleware on the time-travel
  // action; by then validation has run and the Zod-typed query lives
  // in the framework's `_validated` stash.
  const { activityId } = (req._validated?.query ?? {}) as TimeTravelInput;
  const activity = await Activity.findByPk(activityId);
  if (!activity || activity.repositoryId !== req.repository?.id) {
    return createError(StatusCodes.NOT_FOUND, 'Activity not found');
  }
  req.activity = activity;
  next();
}

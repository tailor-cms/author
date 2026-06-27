import type { NextFunction, Response } from 'express';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import { StatusCodes } from 'http-status-codes';
import { USER_SUMMARY_ATTRS } from '#app/user/schemas/entity.ts';

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

// Loads `req.activity` for the reconstruct/restore routes. `activityId` is
// not a path param (so no `router.param`): it arrives as a query param on
// GET (reconstruct) and in the body on POST (restore). Mounted as `after`
// middleware, so validation has already stashed the Zod-typed values in
// `_validated`. `paranoid: false` so a soft-deleted activity can still be
// the target - restore brings it back, reconstruct can view its history.
export async function loadTargetActivity(
  req: any,
  _res: Response,
  next: NextFunction,
) {
  const activityId =
    req._validated?.body?.activityId ?? req._validated?.query?.activityId;
  const activity = await Activity.findByPk(activityId, { paranoid: false });
  if (!activity || activity.repositoryId !== req.repository?.id) {
    return createError(StatusCodes.NOT_FOUND, 'Activity not found');
  }
  req.activity = activity;
  next();
}

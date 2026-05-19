import type { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import type { Repository } from '../repository/models/repository.model.js';

const { Activity, Repository: RepositoryModel } = db;

// Param middleware: loads the Activity onto req and enforces repository
// scoping. paranoid:false so PATCH /restore (and soft-deleted reads) can
// resolve. 404 when missing, 403 when the activity belongs to a different
// repository than the one in scope.
export async function getActivity(
  req: any,
  _res: Response,
  next: NextFunction,
  activityId: string,
) {
  if (!Number.isInteger(Number(activityId))) {
    return createError(StatusCodes.BAD_REQUEST, 'Invalid id format');
  }
  const activity = await Activity.findByPk(activityId, { paranoid: false });
  if (!activity) return createError(StatusCodes.NOT_FOUND, 'Not found');
  if (activity.repositoryId !== req.repository?.id) {
    return createError(StatusCodes.FORBIDDEN, 'Access restricted');
  }
  req.activity = activity;
  next();
}

// /clone route middleware. Verifies the caller can write into the target
// repository (and parent) before the action schema runs.
export async function hasCloneTargetAccess(
  req: any,
  _res: Response,
  next: NextFunction,
) {
  const targetRepositoryId = Number(req.body?.repositoryId);
  if (!Number.isInteger(targetRepositoryId) || targetRepositoryId <= 0) {
    return createError(
      StatusCodes.BAD_REQUEST,
      'repositoryId must be a positive integer',
    );
  }
  const targetRepository = (await RepositoryModel.findByPk(
    targetRepositoryId,
  )) as Repository | null;
  if (!targetRepository) {
    return createError(StatusCodes.BAD_REQUEST, 'Target repository not found');
  }
  const hasTargetAccess = await targetRepository.hasAccess(req.user);
  if (!hasTargetAccess) return createError(StatusCodes.FORBIDDEN);
  // `parentId` is optional (null/undefined means "clone to outline root").
  // When present, must be a positive int referencing an activity in the
  // target repo.
  const rawParentId = req.body?.parentId;
  if (rawParentId != null) {
    const targetParentId = Number(rawParentId);
    if (!Number.isInteger(targetParentId) || targetParentId <= 0) {
      return createError(
        StatusCodes.BAD_REQUEST,
        'parentId must be a positive integer',
      );
    }
    const targetParent = await Activity.findByPk(targetParentId);
    if (!targetParent || targetParent.repositoryId !== targetRepository.id) {
      return createError(
        StatusCodes.BAD_REQUEST,
        'Target parent does not exist',
      );
    }
  }
  next();
}

// /link route middleware. Verifies the linked source activity exists and
// that the user has access to its repository (which may differ from the
// target).
export async function hasLinkSourceAccess(
  req: any,
  _res: Response,
  next: NextFunction,
) {
  const sourceId = Number(req.body?.sourceId);
  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    return createError(
      StatusCodes.BAD_REQUEST,
      'sourceId must be a positive integer',
    );
  }
  const source = await Activity.findByPk(sourceId, {
    include: [RepositoryModel],
  });
  if (!source) return createError(StatusCodes.NOT_FOUND, 'Source not found');
  const repository = source.repository as Repository;
  if (!repository) {
    return createError(StatusCodes.NOT_FOUND, 'Source repository not found');
  }
  const hasAccess = await repository.hasAccess(req.user);
  if (!hasAccess) {
    return createError(StatusCodes.FORBIDDEN, 'No access to source repository');
  }
  next();
}

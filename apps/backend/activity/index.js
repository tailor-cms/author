import express from 'express';
import { StatusCodes } from 'http-status-codes';
import * as validation from '#app/activity/activity.validation.js';
import { createError } from '#shared/error/helpers.js';
import ctrl from '#app/activity/activity.controller.js';
import db from '#shared/database/index.js';
import processListQuery from '#shared/util/processListQuery.js';

const { Activity, Repository } = db;
const router = express.Router();
const processQuery = processListQuery({ order: [['position']] });

router.param('activityId', getActivity);

router
  .route('/')
  .get(processQuery, validation.list, ctrl.list)
  .post(validation.create, ctrl.create);

router
  .route('/:activityId', validation.get)
  .get(validation.get, ctrl.show)
  .patch(validation.update, ctrl.patch)
  .delete(validation.remove, ctrl.remove);

router
  .get('/:activityId/preview', validation.getPreviewUrl, ctrl.getPreviewUrl)
  .get('/:activityId/publish', validation.publish, ctrl.publish)
  .patch('/:activityId/restore', validation.restore, ctrl.restore)
  .post('/:activityId/reorder', validation.reorder, ctrl.reorder)
  .post(
    '/:activityId/clone',
    validation.clone,
    hasCloneTargetAccess,
    ctrl.clone,
  )
  .post(
    '/:activityId/status',
    validation.updateWorkflowStatus,
    ctrl.updateWorkflowStatus,
  );

function getActivity(req, _res, next, activityId) {
  return Activity.findByPk(activityId, { paranoid: false })
    .then((it) => it || createError(StatusCodes.NOT_FOUND, 'Not found'))
    .then((activity) => {
      if (activity.repositoryId !== req.repository.id) {
        return createError(StatusCodes.FORBIDDEN, 'Access restricted');
      }
      req.activity = activity;
      next();
    });
}

async function hasCloneTargetAccess({ body, user }, _res, next) {
  const { repositoryId: targetRepositoryId, parentId: targetParentId } = body;
  const targetRepository = await Repository.findByPk(targetRepositoryId);
  if (!targetRepository)
    throw createError(StatusCodes.BAD_REQUEST, 'Target repository not found');
  const hasTargetAccess = await targetRepository.hasAccess(user);
  if (!hasTargetAccess) throw createError(StatusCodes.FORBIDDEN);
  if (targetParentId) {
    const targetParent = await Activity.findByPk(targetParentId);
    if (!targetParent || targetParent.repositoryId !== targetRepository.id)
      throw createError(
        StatusCodes.BAD_REQUEST,
        'Target parent does not exist',
      );
  }
  next();
}

export default {
  path: '/activities',
  router,
};

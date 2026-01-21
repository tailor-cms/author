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

router.post('/link', validation.link, hasLinkSourceAccess, ctrl.link);

router
  .route('/:activityId', validation.get)
  .get(ctrl.show)
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
  )
  .post('/:activityId/unlink', ctrl.unlink)
  .get('/:activityId/source', ctrl.getSource)
  .get('/:activityId/copies', ctrl.getCopies);

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

async function hasLinkSourceAccess({ body, user }, _res, next) {
  const { sourceId } = body;
  const source = await Activity.findByPk(sourceId, { include: [Repository] });
  if (!source) throw createError(StatusCodes.NOT_FOUND, 'Source not found');
  const hasAccess = await source.repository.hasAccess(user);
  if (!hasAccess)
    throw createError(StatusCodes.FORBIDDEN, 'No access to source repository');
  next();
}

export default {
  path: '/activities',
  router,
};

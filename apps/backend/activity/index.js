import express from 'express';
import { StatusCodes } from 'http-status-codes';
import ctrl from './activity.controller.js';
import db from '#shared/database/index.js';
import { createError } from '#shared/error/helpers.js';
import processListQuery from '#shared/util/processListQuery.js';
import * as validation from '#activity/activity.validation.js';

const { Activity } = db;
const router = express.Router();
const processQuery = processListQuery({ order: [['position']] });

router.param('activityId', getActivity);

router.route('/').get(processQuery, ctrl.list).post(ctrl.create);

router
  .route('/:activityId', validation.get)
  .get(ctrl.show, validation.get)
  .patch(ctrl.patch, validation.update)
  .delete(ctrl.remove, validation.remove);

router
  .get('/:activityId/preview', validation.getPreviewUrl, ctrl.getPreviewUrl)
  .get('/:activityId/publish', validation.publish, ctrl.publish)
  .patch('/:activityId/restore', validation.restore, ctrl.restore)
  .post('/:activityId/reorder', validation.reorder, ctrl.reorder)
  .post('/:activityId/clone', validation.clone, ctrl.clone)
  .post(
    '/:activityId/status',
    validation.updateWorkflowStatus,
    ctrl.updateStatus,
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

export default {
  path: '/activities',
  router,
};

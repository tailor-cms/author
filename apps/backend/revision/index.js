import express from 'express';
import { StatusCodes } from 'http-status-codes';

import * as validation from '#app/revision/revision.validation.js';
import { createError } from '#shared/error/helpers.js';
import ctrl from '#app/revision/revision.controller.js';
import db from '#shared/database/index.js';
import processListQuery from '#shared/util/processListQuery.js';

const { NOT_FOUND } = StatusCodes;
const { Activity, Revision, User } = db;

const router = express.Router();
const defaultListQuery = { order: [['createdAt', 'DESC']] };

router.param('revisionId', getRevision);

router
  .get('/', validation.list, processListQuery(defaultListQuery), ctrl.index)
  .get(
    '/time-travel',
    validation.getStateAtMoment,
    loadTargetActivity,
    ctrl.getStateAtMoment,
  )
  .get('/:revisionId', validation.get, ctrl.get);

function getRevision(req, _res, next, revisionId) {
  const id = parseInt(revisionId, 10);
  const include = [{ model: User, attributes: ['id', 'email'] }];
  return Revision.fetch(id, { include }).then((val) => {
    if (!val || val.repositoryId !== req.repository.id) {
      return createError(NOT_FOUND, 'Revision not found');
    }
    req.revision = val;
    next();
  });
}

function loadTargetActivity(req, _res, next) {
  const { activityId } = req.query;
  return Activity.findByPk(activityId).then((activity) => {
    if (!activity || !activity.repositoryId === req.repository?.id)
      return createError(NOT_FOUND, 'Activity not found');
    req.activity = activity;
    next();
  });
}

export default {
  path: '/revisions',
  router,
};

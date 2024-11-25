import express from 'express';
import { StatusCodes } from 'http-status-codes';
import db from '../shared/database/index.js';
import { createError } from '../shared/error/helpers.js';
import processListQuery from '../shared/util/processListQuery.js';
import ctrl from './revision.controller.js';

const { NOT_FOUND } = StatusCodes;
const { Revision, User } = db;
const router = express.Router();
const defaultListQuery = {
  order: [['createdAt', 'DESC']],
};

router.param('revisionId', getRevision);

router
  .get('/time-travel', ctrl.getStateAtMoment)
  .get('/', processListQuery(defaultListQuery), ctrl.index)
  .get('/:revisionId', ctrl.get);

function getRevision(req, _res, next, revisionId) {
  const id = parseInt(revisionId, 10);
  const include = [{ model: User, attributes: ['id', 'email'] }];
  return Revision.fetch(id, { include })
    .then(
      (revision) => revision || createError(NOT_FOUND, 'Revision not found'),
    )
    .then((revision) => {
      req.revision = revision;
      next();
    });
}

export default {
  path: '/revisions',
  router,
};

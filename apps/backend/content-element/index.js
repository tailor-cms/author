import express from 'express';
import { StatusCodes } from 'http-status-codes';
import ctrl from './content-element.controller.js';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import processListQuery from '#shared/util/processListQuery.js';

const { ContentElement } = db;
const processQuery = processListQuery();
const router = express.Router();

router.param('elementId', getContentElement);
router.route('/').get(processQuery, ctrl.list).post(ctrl.create);

router
  .route('/:elementId')
  .get(ctrl.show)
  .patch(ctrl.patch)
  .delete(ctrl.remove);

router.post('/:elementId/reorder', ctrl.reorder);

function getContentElement(req, _res, next, elementId) {
  return ContentElement.findByPk(elementId, { paranoid: false })
    .then((it) => it || createError(StatusCodes.NOT_FOUND, 'Not found'))
    .then((contentElement) => {
      req.contentElement = contentElement;
      next();
    });
}

export default {
  path: '/content-elements',
  router,
};

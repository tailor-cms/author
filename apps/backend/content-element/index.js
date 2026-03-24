import express from 'express';
import { StatusCodes } from 'http-status-codes';
import ctrl from './content-element.controller.js';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';
import processListQuery from '#shared/util/processListQuery.js';

const { ContentElement, Repository } = db;
const processQuery = processListQuery();
const router = express.Router();

router.param('elementId', getContentElement);
router.route('/').get(processQuery, ctrl.list).post(ctrl.create);
router.post('/link', hasLinkSourceAccess, ctrl.link);

router
  .route('/:elementId')
  .get(ctrl.show)
  .patch(ctrl.patch)
  .delete(ctrl.remove);

router.post('/:elementId/reorder', ctrl.reorder);
router.post('/:elementId/unlink', ctrl.unlink);
router.get('/:elementId/source', ctrl.getSource);
router.get('/:elementId/copies', ctrl.getCopies);

function getContentElement(req, _res, next, elementId) {
  if (!Number.isInteger(Number(elementId))) {
    return createError(StatusCodes.BAD_REQUEST, 'Invalid id format');
  }
  return ContentElement.findByPk(elementId, { paranoid: false })
    .then((it) => it || createError(StatusCodes.NOT_FOUND, 'Not found'))
    .then((contentElement) => {
      if (contentElement.repositoryId !== req.repository.id) {
        return createError(StatusCodes.FORBIDDEN, 'Access restricted');
      }
      req.contentElement = contentElement;
      next();
    });
}

async function hasLinkSourceAccess(req, _res, next) {
  const { sourceId } = req.body;
  const source = await ContentElement.findByPk(sourceId, {
    include: [Repository],
  });
  if (!source) throw createError(StatusCodes.NOT_FOUND, 'Source not found');
  const hasAccess = await source.repository.hasAccess(req.user);
  if (!hasAccess)
    throw createError(StatusCodes.FORBIDDEN, 'No access to source repository');
  next();
}

export default {
  path: '/content-elements',
  router,
};

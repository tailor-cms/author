import express from 'express';
import processQuery from '#shared/util/processListQuery.js';

import * as actions from './actions/index.ts';
import { canEdit, getComment } from './middleware.ts';
import { createActionMounter } from '#shared/request/action.ts';

const router = express.Router();

const mount = createActionMounter(
  router,
  '/repositories/:repositoryId/comments',
  'Comment',
);

const defaultListQuery = {
  order: [['createdAt', 'DESC']],
  paranoid: false,
};

router.param('commentId', getComment);

// Registered FIRST so the literal
// path matches before the `:commentId` param middleware would treat
// 'resolve' as a comment id.
mount.post('/resolve', actions.resolve);

mount
  .get('/', actions.list, { after: [processQuery(defaultListQuery)] })
  .post('/', actions.create);

mount
  .patch('/:commentId', actions.patch, { before: [canEdit] })
  .delete('/:commentId', actions.remove, { before: [canEdit] });

export default {
  path: '/comments',
  router,
};

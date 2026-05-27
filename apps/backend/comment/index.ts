import express from 'express';
import processQuery from '#shared/util/processListQuery.js';

import * as actions from './actions/index.ts';
import { canEdit, getComment } from './middleware.ts';
import { createActionMounter } from '#shared/request/action.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params`
const router = express.Router({ mergeParams: true });
const basePath = '/repositories/:repositoryId/comments';

// Two mounters, one router. Each carries a distinct OpenAPI tag so the
// Scalar sidebar splits the slice's surface into `CRUD` and `Resolution`,
// both bundled under the `Comment` x-tagGroup. Mounter creation order
// drives sidebar order (via createActionMounter's internal counter), so
// declare them here in the order you want them rendered.
const crud = createActionMounter(router, basePath, {
  tag: 'CRUD', group: 'Comment',
});
const lifecycle = createActionMounter(router, basePath, {
  tag: 'Resolution', group: 'Comment',
});

const defaultListQuery = {
  order: [['createdAt', 'DESC']],
  paranoid: false,
};

router.param('commentId', getComment);

// Literal `/resolve` MUST register before any `/:commentId` route so
// Express doesn't bind 'resolve' as the comment id and run getComment.
lifecycle.post('/resolve', actions.resolve);

crud
  .get('/', actions.list, { after: [processQuery(defaultListQuery)] })
  .post('/', actions.create)
  .patch('/:commentId', actions.patch, { before: [canEdit] })
  .delete('/:commentId', actions.remove, { before: [canEdit] });

export default {
  path: '/comments',
  router,
};

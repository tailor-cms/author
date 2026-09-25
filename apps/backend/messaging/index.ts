import * as actions from './actions/index.ts';
import { canEdit, getMessage } from './middleware.ts';
import { createActionMounter } from '#shared/request/action.ts';
import express from 'express';
import integrationRouter from './integration/index.ts';
import processQuery from '#shared/util/processListQuery.js';
import threadRouter from './thread/index.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params`
const router = express.Router({ mergeParams: true });
const basePath = '/repositories/:repositoryId/messaging';

const crud = createActionMounter(router, basePath, {
  tag: 'CRUD',
  group: 'Messaging',
});

const lifecycle = createActionMounter(router, basePath, {
  tag: 'Resolution',
  group: 'Messaging',
});

const search = createActionMounter(router, basePath, {
  tag: 'Search',
  group: 'Messaging',
});

const defaultListQuery = {
  order: [['createdAt', 'DESC']],
  paranoid: false,
};

router.param('messageId', getMessage);

// Messages live at the slice root, so every literal segment - including
// the sub-slice mounts - MUST register before the `/:messageId` routes,
// or Express binds it as a message id and runs `getMessage` against it.
router.use('/integrations', integrationRouter);
router.use('/', threadRouter);

lifecycle.post('/resolve', actions.resolve);

search.get('/search', actions.search);
search.get('/assets', actions.assets);

crud
  .get('/', actions.list, {
    after: [processQuery(defaultListQuery)],
  })
  .post('/', actions.create)
  .get('/:messageId/replies', actions.replies)
  .post('/:messageId/reactions', actions.reactions)
  .patch('/:messageId', actions.patch, { before: [canEdit] })
  .delete('/:messageId', actions.remove, { before: [canEdit] });

export default {
  path: '/messaging',
  router,
};

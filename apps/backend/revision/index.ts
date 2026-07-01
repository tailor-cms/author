import express from 'express';
import processQuery from '#shared/util/processListQuery.js';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { getRevision, loadTargetActivity } from './middleware.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params` inside this sub-router.
const router = express.Router({ mergeParams: true });
const basePath = '/repositories/:repositoryId/revisions';

// Sidebar order tracks mounter declaration order (via createActionMounter's
// internal counter); declare here in the order the docs should read.
const GROUP = 'Revision';

const records = createActionMounter(router, basePath, {
  tag: 'Records', group: GROUP,
});

const history = createActionMounter(router, basePath, {
  tag: 'History', group: GROUP,
});

const defaultListQuery = { order: [['createdAt', 'DESC']] };

router.param('revisionId', getRevision);

// /reconstruct and /restore are siblings of /:revisionId, registered
// FIRST so their literal paths match before the `:revisionId` param
// middleware would treat them as numeric ids.
history.get('/reconstruct', actions.reconstruct, {
  after: [loadTargetActivity],
});

history.post('/restore', actions.restore, {
  after: [loadTargetActivity],
});

records
  .get('/', actions.list, { after: [processQuery(defaultListQuery)] })
  .get('/:revisionId', actions.get);

export default {
  path: '/revisions',
  router,
};

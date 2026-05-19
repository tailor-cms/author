import express from 'express';
import processQuery from '#shared/util/processListQuery.js';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { getRevision, loadTargetActivity } from './middleware.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params` inside this sub-router.
const router = express.Router({ mergeParams: true });
const basePath = '/repositories/:repositoryId/revisions';
const mount = createActionMounter(router, basePath, 'Revision');

const defaultListQuery = { order: [['createdAt', 'DESC']] };

router.param('revisionId', getRevision);

// /time-travel is a sibling of /:revisionId, registered FIRST so the
// literal path matches before the `:revisionId` param middleware would
// treat 'time-travel' as a numeric id.
mount.get('/time-travel', actions.timeTravel, {
  after: [loadTargetActivity],
});

mount
  .get('/', actions.list, { after: [processQuery(defaultListQuery)] })
  .get('/:revisionId', actions.get);

export default {
  path: '/revisions',
  router,
};

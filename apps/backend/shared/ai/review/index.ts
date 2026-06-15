import express from 'express';
import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { getActivity } from '../../../activity/middleware.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params` inside this sub-router.
const router = express.Router({ mergeParams: true });

// Full mounted path (incl. the parent repository segment) so the
// OpenAPI doc records reachable URLs and the generated api-client can
// call these routes
const mount = createActionMounter(
  router,
  '/repositories/:repositoryId/ai/review',
  { tag: 'Review', group: 'AI' },
);

// Loads the activity row, enforces repository scoping
router.param('activityId', getActivity);

mount
  .get('/:activityId', actions.get)
  .post('/:activityId', actions.request);

export default { path: '/ai/review', router };

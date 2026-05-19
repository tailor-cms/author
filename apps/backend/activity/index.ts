import express from 'express';
import processQuery from '#shared/util/processListQuery.js';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import {
  getActivity,
  hasCloneTargetAccess,
  hasLinkSourceAccess,
} from './middleware.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params`
const router = express.Router({ mergeParams: true });
const basePath = '/repositories/:repositoryId/activities';

const mount = createActionMounter(router, basePath, 'Activity');

const defaultListQuery = { order: [['position']] };

router.param('activityId', getActivity);

// /link is a sibling of the collection root, registered FIRST so the
// literal path matches before the `:activityId` param middleware would
// treat 'link' as an activity id.
mount.post('/link', actions.link, { before: [hasLinkSourceAccess] });

mount
  .get('/', actions.list, { after: [processQuery(defaultListQuery)] })
  .post('/', actions.create);

mount
  .get('/:activityId', actions.get)
  .patch('/:activityId', actions.patch)
  .delete('/:activityId', actions.remove);

mount
  .get('/:activityId/preview', actions.preview)
  .get('/:activityId/publish', actions.publish)
  .patch('/:activityId/restore', actions.restore)
  .post('/:activityId/reorder', actions.reorder)
  .post('/:activityId/clone', actions.clone, {
    before: [hasCloneTargetAccess],
  })
  .post('/:activityId/status', actions.updateWorkflowStatus);

// Linked-content operations
mount
  .post('/:activityId/unlink', actions.unlink)
  .get('/:activityId/source', actions.getSource)
  .get('/:activityId/copies', actions.getCopies);

export default {
  path: '/activities',
  router,
};

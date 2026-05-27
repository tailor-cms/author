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

// Five mounters, one router — each carries a distinct OpenAPI tag so
// the Scalar sidebar splits the slice's surface into five cohesive
// sections (`CRUD`, `Structure`, `Lifecycle`, `Publishing`, `Linked
// content`), all bundled under the `Activity` x-tagGroup. The mounter
// is metadata only; route registration happens in call order below.
// Sidebar order tracks mounter declaration order (via createActionMounter's
// internal counter), so declare them here in the order you want them
// rendered.
const crud = createActionMounter(router, basePath, {
  tag: 'CRUD', group: 'Activity',
});
const structure = createActionMounter(router, basePath, {
  tag: 'Structure', group: 'Activity',
});
const lifecycle = createActionMounter(router, basePath, {
  tag: 'Lifecycle', group: 'Activity',
});
const publishing = createActionMounter(router, basePath, {
  tag: 'Publishing', group: 'Activity',
});
const linked = createActionMounter(router, basePath, {
  tag: 'Linked content', group: 'Activity',
});

const defaultListQuery = { order: [['position']] };

router.param('activityId', getActivity);

// Literal `/link` MUST register before any `/:activityId` route so
// Express doesn't bind 'link' as the activity id and run getActivity
// on it.
linked.post('/link', actions.link, { before: [hasLinkSourceAccess] });

crud
  .get('/', actions.list, { after: [processQuery(defaultListQuery)] })
  .post('/', actions.create)
  .get('/:activityId', actions.get)
  .patch('/:activityId', actions.patch)
  .delete('/:activityId', actions.remove);

structure
  .post('/:activityId/reorder', actions.reorder)
  .post('/:activityId/clone', actions.clone, {
    before: [hasCloneTargetAccess],
  });

lifecycle
  .patch('/:activityId/restore', actions.restore)
  .post('/:activityId/status', actions.updateWorkflowStatus);

publishing
  .get('/:activityId/preview', actions.preview)
  .get('/:activityId/publish', actions.publish);

linked
  .post('/:activityId/unlink', actions.unlink)
  .get('/:activityId/source', actions.getSource)
  .get('/:activityId/copies', actions.getCopies);

export default {
  path: '/activities',
  router,
};

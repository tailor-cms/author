import express from 'express';
import processQuery from '#shared/util/processListQuery.js';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { getContentElement, hasLinkSourceAccess } from './middleware.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params`
const router = express.Router({ mergeParams: true });
const basePath = '/repositories/:repositoryId/content-elements';

// Three mounters, one router; each carries a distinct OpenAPI tag so the
// Scalar sidebar splits the slice's surface into `CRUD`, `Structure`, and
// `Linked content`, all bundled under the `Content Element` x-tagGroup.
// The mounter is metadata only; route registration happens in call order
// below.
const crud = createActionMounter(router, basePath, {
  tag: 'CRUD', group: 'Content Element',
});
const structure = createActionMounter(router, basePath, {
  tag: 'Structure', group: 'Content Element',
});
const linked = createActionMounter(router, basePath, {
  tag: 'Linked content', group: 'Content Element',
});

router.param('elementId', getContentElement);

// Literal `/link` MUST register before any `/:elementId` route so Express
// doesn't bind 'link' as the element id and run getContentElement on it.
linked.post('/link', actions.link, { before: [hasLinkSourceAccess] });

crud
  .get('/', actions.list, { after: [processQuery()] })
  .post('/', actions.create)
  .get('/:elementId', actions.get)
  .patch('/:elementId', actions.patch)
  .delete('/:elementId', actions.remove);

structure.post('/:elementId/reorder', actions.reorder);

linked
  .post('/:elementId/unlink', actions.unlink)
  .get('/:elementId/source', actions.getSource)
  .get('/:elementId/copies', actions.getCopies);

export default {
  path: '/content-elements',
  router,
};

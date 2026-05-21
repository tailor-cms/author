import express from 'express';
import processQuery from '#shared/util/processListQuery.js';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { getContentElement, hasLinkSourceAccess } from './middleware.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params`
const router = express.Router({ mergeParams: true });
const basePath = '/repositories/:repositoryId/content-elements';
const mount = createActionMounter(router, basePath, 'Content Element');

router.param('elementId', getContentElement);

// /link is a sibling of the collection root, registered FIRST so the
// literal path matches before the `:elementId` param middleware would
// treat any following segment as an element id.
mount.post('/link', actions.link, { before: [hasLinkSourceAccess] });

mount
  .get('/', actions.list, { after: [processQuery()] })
  .post('/', actions.create);

mount
  .get('/:elementId', actions.get)
  .patch('/:elementId', actions.patch)
  .delete('/:elementId', actions.remove);

mount
  .post('/:elementId/reorder', actions.reorder)
  .post('/:elementId/unlink', actions.unlink)
  .get('/:elementId/source', actions.getSource)
  .get('/:elementId/copies', actions.getCopies);

export default {
  path: '/content-elements',
  router,
};

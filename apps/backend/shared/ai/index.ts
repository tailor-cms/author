import express from 'express';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params` inside this sub-router.
const router = express.Router({ mergeParams: true });

const mount = createActionMounter(
  router,
  '/repositories/:repositoryId/ai',
  { tag: 'Generation', group: 'AI' },
);

mount.post('/generate', actions.generate);

export default { path: '/ai', router };

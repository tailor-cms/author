import express from 'express';

import { createActionMounter } from '#shared/request/action.ts';
import dispatch from './actions/dispatch.action.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params`
const router = express.Router({ mergeParams: true });
const mount = createActionMounter(
  router,
  '/repositories/:repositoryId/rpc',
  'RPC',
);

mount.post('/:type/:procedure', dispatch);

export default {
  path: '/rpc',
  router,
};

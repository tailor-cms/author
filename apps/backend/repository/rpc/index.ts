import express from 'express';

import { createActionMounter } from '#shared/request/action.ts';
import dispatch from './actions/dispatch.action.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params`
const router = express.Router({ mergeParams: true });

// RPC dispatches for content-element plugin procedures (`:type` is a CE
// type id, `:procedure` is a name from that plugin's `procedures` map),
// Repo-scoped utility, not a first-class resource.
const mount = createActionMounter(
  router,
  '/repositories/:repositoryId/rpc',
  { tag: 'Content Element RPC', group: 'Repository' },
);

mount.post('/:type/:procedure', dispatch);

export default {
  path: '/rpc',
  router,
};

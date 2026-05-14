import express from 'express';

import { createActionMounter } from '#shared/request/action.ts';
import dispatch from './actions/dispatch.action.ts';

const router = express.Router();
const mount = createActionMounter(
  router,
  '/repositories/:repositoryId/rpc',
);

mount.post('/:type/:procedure', dispatch);

export default {
  path: '/rpc',
  router,
};

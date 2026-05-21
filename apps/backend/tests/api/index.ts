import express from 'express';
import { authorize } from '#shared/auth/mw.js';
import { createActionMounter } from '#shared/request/action.ts';

import * as actions from './actions/index.ts';

const router = express.Router();
const mount = createActionMounter(router, '/seed', 'Seed (test-only)');

router.use(authorize());

mount
  .post('/reset', actions.reset)
  .post('/user', actions.user)
  .post('/catalog', actions.catalog)
  .post('/comment', actions.comment)
  .post('/repository', actions.repository);

export default {
  path: '/seed',
  router,
};

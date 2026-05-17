import express from 'express';
import processQuery from '#shared/util/processListQuery.js';
import { authorize } from '#shared/auth/mw.js';
import { createActionMounter } from '#shared/request/action.ts';

import * as actions from './actions/index.ts';
import { getUserGroup } from './middleware.ts';

const router = express.Router();
const mount = createActionMounter(router, '/user-group', 'User Group');

router.param('id', getUserGroup);

mount
  .get('/', actions.list, { after: [processQuery({})] })
  .post('/', actions.create, { before: [authorize()] });

// CRUD
mount
  .get('/:id', actions.get)
  .patch('/:id', actions.patch)
  .delete('/:id', actions.remove);

// Members
mount
  .get('/:id/users', actions.getUsers)
  .post('/:id/users', actions.upsertUser)
  .delete('/:id/users/:userId', actions.removeUser);

export default {
  path: '/user-group',
  router,
};

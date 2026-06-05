import express from 'express';
import processQuery from '#shared/util/processListQuery.js';
import { authorize } from '#shared/auth/mw.js';
import { createActionMounter } from '#shared/request/action.ts';

import * as actions from './actions/index.ts';
import { getUserGroup } from './middleware.ts';

const router = express.Router();

// Sidebar order tracks mounter declaration order (via createActionMounter's
// internal counter); declare here in the order the docs should read.
const GROUP = 'User Group';

const crud = createActionMounter(router, '/user-group', {
  tag: 'CRUD', group: GROUP,
});

const members = createActionMounter(router, '/user-group', {
  tag: 'Members', group: GROUP,
});

// Check getUserGroup for access control
router.param('id', getUserGroup);

crud
  .get('/', actions.list, { after: [processQuery({})] })
  .post('/', actions.create, { before: [authorize()] })
  .get('/:id', actions.get)
  .patch('/:id', actions.patch)
  .delete('/:id', actions.remove);

members
  .get('/:id/users', actions.listMembers)
  .post('/:id/users', actions.upsertMembers)
  .delete('/:id/users/:userId', actions.removeMember);

export default {
  path: '/user-group',
  router,
};

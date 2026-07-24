import express from 'express';
import processQuery from '#shared/util/processListQuery.js';
import { createActionMounter } from '#shared/request/action.ts';

import * as actions from './actions/index.ts';
import { authorizeGroupWrite, getUserGroup } from './middleware.ts';

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

// getUserGroup gates every /:id route to system admins OR the group's own
// admins - the member-management surface. Writing the group entity itself
// (create/patch/delete) is narrower: system admins only (authorizeGroupWrite,
// which layers on top of the param gate for the /:id routes).
router.param('id', getUserGroup);

crud
  .get('/', actions.list, { after: [processQuery({})] })
  .post('/', actions.create, { before: [authorizeGroupWrite] })
  .get('/:id', actions.get)
  .patch('/:id', actions.patch, { before: [authorizeGroupWrite] })
  .delete('/:id', actions.remove, { before: [authorizeGroupWrite] });

members
  .get('/:id/users', actions.listMembers)
  .post('/:id/users', actions.upsertMembers)
  .delete('/:id/users/:userId', actions.removeMember);

export default {
  path: '/user-group',
  router,
};

import { defineAction } from '#shared/request/action.ts';
import * as service from '../../user-group.service.ts';

// GET /user-group/:id/users
// Returns the group's members. Each user carries the join row at
// `user.userGroupMember` (which holds the group role).
export default defineAction({
  openapi: {
    summary: 'List members of a user group',
    authenticated: true,
  },
  async handler({ req }) {
    return service.listMembers(req.userGroup!);
  },
});

import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../../user-group.schema.ts';
import * as service from '../../user-group.service.ts';

// POST /user-group/:id/users
// Invites missing users by email and assigns each on the group (or
// updates an existing member's role). Capped at 50 invites per call so
// a single request cannot trigger a thundering herd of invitation mails.
export default defineAction({
  body: schemas.UpsertMembersBody,
  openapi: {
    summary: 'Invite or update members of a user group',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  async handler({ body, req }) {
    await service.upsertMembers(req.userGroup!, body);
  },
});

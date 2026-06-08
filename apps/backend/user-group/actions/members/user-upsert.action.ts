import * as schemas from '../../schemas/index.ts';
import * as service from '../../user-group.service.ts';
import { defineAction } from '#shared/request/action.ts';

export default defineAction({
  body: schemas.UpsertMembersInput,
  openapi: {
    authenticated: true,
    summary: 'Invite or update members of a user group',
    responses: {
      204: { description: 'No content' },
      403: { description: 'Caller is not an admin or group admin' },
      404: { description: 'User group not found' },
    },
  },
  async handler({ body, req }) {
    await service.upsertMembers(req.userGroup!, body);
  },
});

import * as schemas from '../../schemas/index.ts';
import * as service from '../../user-group.service.ts';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

export default defineAction({
  name: 'addUser',
  body: schemas.UpsertMembersInput,
  openapi: {
    authenticated: true,
    summary: 'Invite or update members of a user group',
    responses: {
      200: {
        description: 'Summary of created/updated/skipped members.',
        schema: dataEnvelope(schemas.UpsertMembersResult),
      },
      403: { description: 'Caller is not an admin or group admin' },
      404: { description: 'User group not found' },
    },
  },
  async handler({ body, req }) {
    return service.upsertMembers(req.userGroup!, body);
  },
});

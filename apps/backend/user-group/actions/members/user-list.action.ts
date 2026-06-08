import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../../schemas/index.ts';
import * as service from '../../user-group.service.ts';

export default defineAction({
  openapi: {
    authenticated: true,
    summary: 'List members of a user group',
    responses: {
      200: {
        description: 'Members of the user group, each with their join row.',
        schema: dataEnvelope(z.array(schemas.GroupMember)),
      },
      403: { description: 'Caller is not an admin or group admin' },
      404: { description: 'User group not found' },
    },
  },
  async handler({ req }) {
    return service.listMembers(req.userGroup!);
  },
});

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';

export default defineAction({
  openapi: {
    authenticated: true,
    summary: 'Get a user group by id',
    responses: {
      200: {
        description: 'User group.',
        schema: dataEnvelope(schemas.UserGroup),
      },
      403: { description: 'Caller is not an admin or group admin' },
      404: { description: 'User group not found' },
    },
  },
  async handler({ req }) {
    return req.userGroup!;
  },
});

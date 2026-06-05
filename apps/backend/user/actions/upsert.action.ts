import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

export default defineAction({
  body: schemas.UpsertInput,
  openapi: {
    authenticated: true,
    summary: 'Invite or update a user (admin)',
    responses: {
      200: {
        description: 'Upserted user profile.',
        schema: dataEnvelope(schemas.User),
      },
    },
  },
  async handler({ body }) {
    return service.upsert(body);
  },
});

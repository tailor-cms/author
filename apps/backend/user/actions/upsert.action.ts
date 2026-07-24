import { audit } from '#shared/audit.ts';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

export default defineAction({
  name: 'upsert',
  body: schemas.UpsertInput,
  openapi: {
    authenticated: true,
    summary: 'Invite or update a user',
    responses: {
      200: {
        description: 'Upserted user profile.',
        schema: dataEnvelope(schemas.User),
      },
    },
  },
  async handler({ body, user }) {
    const profile = await service.upsert(body);
    // Account administration is audited: who (actor) changed which account
    // and; Role escalation matters most.
    audit('user:upsert', 'success', {
      userId: profile.id,
      email: profile.email,
      role: body.role,
      actorId: user.id,
    });
    return profile;
  },
});

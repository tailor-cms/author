import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import service from '../seed.service.ts';

// POST /seed/user
// Creates (or finds-by-email) a test user, optionally attaching them
// to a user group. Generous defaults via faker for omitted fields.
export default defineAction({
  body: schemas.UserInput,
  openapi: {
    summary: 'Seed a user',
    description: oneLine`
      Creates or finds-by-email a test user, optionally attaching them
      to a user group. Missing fields are faker-generated server-side.
    `,
    authenticated: true,
  },
  async handler({ body }) {
    return service.createUser(body);
  },
});

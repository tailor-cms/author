import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../user.schema.ts';
import * as service from '../user.service.ts';

// POST /users
// Admin-driven invite-or-update. Email is the natural key; matching an
// existing user (paranoid:false) updates them in place, otherwise the
// user is created and emailed an invitation (unless `skipInvite` is set,
// e.g. for SSO accounts that don't need a password setup mail).
export default defineAction({
  body: schemas.UpsertBody,
  openapi: {
    summary: 'Invite or update a user (admin)',
    authenticated: true,
  },
  async handler({ body }) {
    return service.upsert(body);
  },
});

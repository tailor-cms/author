import { defineAction } from '#shared/request/action.ts';
import * as service from '../user.service.ts';

// GET /users/me
// Returns the current user's public profile, their accessible user
// groups and the auth-strategy data the client store needs to keep the
// session coherent.
export default defineAction({
  raw: true,
  openapi: {
    summary: 'Get the current user profile',
    authenticated: true,
  },
  async handler({ user, req }) {
    return service.profile(user, req.authData);
  },
});

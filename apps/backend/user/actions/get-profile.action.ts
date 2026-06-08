import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

export default defineAction({
  raw: true,
  openapi: {
    authenticated: true,
    summary: 'Get the current user profile',
    responses: {
      200: {
        description: 'Current user profile bundle.',
        schema: schemas.ProfileResult,
      },
    },
  },
  async handler({ user, req }) {
    return service.profile(user, req.authData);
  },
});

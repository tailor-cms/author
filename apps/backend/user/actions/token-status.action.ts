import { StatusCodes } from 'http-status-codes';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../user.schema.ts';

// POST /users/reset-password/token-status
// Mounted with the same
// `requestLimiter` + `authenticate('token')` chain as /reset-password.
// The client can use it to validate a token before showing the
// new-password form.
export default defineAction({
  body: schemas.TokenStatusInput,
  status: StatusCodes.ACCEPTED,
  openapi: {
    summary: 'Validate a password-reset token',
    responses: { 202: { description: 'Token is valid' } },
  },
  async handler() {
    // Empty; the auth middleware did the work.
  },
});

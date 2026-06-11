import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { WeakPasswordError } from '../lib/password-strength.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

// Token-authenticated password reset. The route is mounted with the
// shared `requestLimiter` + `authenticate('token')` chain in `before`;
// passport stashes the resolved user on `req.user` and this handler
// just persists the new password (the model hashes it on update).
// Weak-password failures surface as 400 with the zxcvbn warning carried
// in `error.message`.
async function handler({
  body,
  req,
}: Ctx<{ body: typeof schemas.ResetPasswordInput }>) {
  try {
    await service.resetPassword(req.user!, body.password);
  } catch (err) {
    if (err instanceof WeakPasswordError) {
      return createError(StatusCodes.UNPROCESSABLE_ENTITY, err.message);
    }
    throw err;
  }
}

export default defineAction({
  name: 'resetPassword',
  body: schemas.ResetPasswordInput,
  openapi: {
    summary: 'Replace the password using a reset token',
    responses: {
      204: { description: 'No content' },
      422: { description: 'Weak password (carries the zxcvbn warning)' },
    },
  },
  handler,
});

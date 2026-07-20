import { StatusCodes } from 'http-status-codes';
import { audit } from '#shared/audit.ts';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { createError } from '#shared/error/helpers.js';
import { WeakPasswordError } from '../lib/password-strength.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

const ERR_MSG = `Couldn't update password. Make sure your current password is correct.`;

async function handler({
  body,
  user,
}: Ctx<{ body: typeof schemas.ChangePasswordInput }>) {
  if (body.currentPassword === body.newPassword) {
    return createError(StatusCodes.BAD_REQUEST, ERR_MSG);
  }
  try {
    const ok = await service.changePassword(
      user,
      body.currentPassword,
      body.newPassword,
    );
    // A wrong current password is a failed credential check
    audit('auth:password-change', ok ? 'success' : 'failure', {
      userId: user.id,
    });
    if (!ok) return createError(StatusCodes.BAD_REQUEST, ERR_MSG);
  } catch (err) {
    if (err instanceof WeakPasswordError) {
      return createError(StatusCodes.UNPROCESSABLE_ENTITY, err.message);
    }
    throw err;
  }
}

export default defineAction({
  name: 'changePassword',
  body: schemas.ChangePasswordInput,
  openapi: {
    authenticated: true,
    summary: 'Change the current user password',
    responses: {
      204: { description: 'No content' },
      400: {
        description: 'Same password or wrong current password',
      },
      422: {
        description: 'Weak new password (carries the zxcvbn warning)',
      },
    },
  },
  handler,
});

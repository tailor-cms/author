import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../user.schema.ts';
import * as service from '../user.service.ts';

// POST /users/forgot-password
// Public endpoint that mails a password-reset token to the supplied
// address. Always returns 204 - revealing whether an email is
// registered would let any caller figure out which users are registered.
// The mail is dispatched only for known emails; unknown
// emails just no-op silently.
async function handler({
  body,
}: Ctx<{ body: typeof schemas.ForgotPasswordInput }>) {
  await service.startPasswordReset(body.email);
}

export default defineAction({
  body: schemas.ForgotPasswordInput,
  openapi: {
    summary: 'Mail a password-reset token',
    responses: { 204: { description: 'No content' } },
  },
  handler,
});

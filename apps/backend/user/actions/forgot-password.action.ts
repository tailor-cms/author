import { audit } from '#shared/audit.ts';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

// POST /users/forgot-password
// Public endpoint that mails a password-reset token to the supplied
// address. Always returns 204 - revealing whether an email is
// registered would let any caller figure out which users are registered.
// The mail is dispatched only for known emails; unknown
// emails just no-op silently.
async function handler({
  body,
  req,
}: Ctx<{ body: typeof schemas.ForgotPasswordInput }>) {
  // A burst of requests for many addresses from one ip is an
  // account-enumeration probe.
  audit('auth:password-reset-request', 'success', {
    email: body.email,
    ip: req.ip,
  });
  await service.startPasswordReset(body.email);
}

export default defineAction({
  name: 'forgotPassword',
  body: schemas.ForgotPasswordInput,
  openapi: {
    summary: 'Mail a password-reset token',
    responses: { 204: { description: 'No content' } },
  },
  handler,
});

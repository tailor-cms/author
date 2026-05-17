import { z } from 'zod';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { Email } from '#shared/request/schemas.ts';
import * as service from '../user.service.ts';

// POST /users/forgot-password
// Public endpoint that mails a password-reset token to the supplied
// address. Always returns 204 - revealing whether an email is
// registered would let any caller figure out which users are registered.
// The mail is dispatched only for known emails; unknown
// emails just no-op silently.
const Body = z.object({
  email: Email(),
});
export type ForgotPasswordBody = z.infer<typeof Body>;

async function handler({ body }: Ctx<{ body: typeof Body }>) {
  await service.startPasswordReset(body.email);
}

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Mail a password-reset token',
    responses: { 204: { description: 'No content' } },
  },
  handler,
});

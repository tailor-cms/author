import { z } from 'zod';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as service from '../user.service.ts';

// POST /users/reset-password
// Token-authenticated password reset. The route is mounted with the
// shared `requestLimiter` + `authenticate('token')` chain in `before`;
// passport stashes the resolved user on `req.user` and this handler
// just persists the new password (the model hashes it on update).
const Body = z.object({
  // 5..100 mirrors the User model's column-level length validator.
  password: z.string().min(5).max(100),
  // The reset token rides along in the body so the auth strategy can
  // pick it up; we accept it here only to keep the schema honest about
  // the wire shape.
  token: z.string().optional(),
});
export type ResetPasswordBody = z.infer<typeof Body>;

async function handler({ body, req }: Ctx<{ body: typeof Body }>) {
  await service.resetPassword(req.user!, body.password);
}

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Replace the password using a reset token',
    responses: { 204: { description: 'No content' } },
  },
  handler,
});

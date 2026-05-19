import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../user.schema.ts';
import * as service from '../user.service.ts';

// POST /users/reset-password
// Token-authenticated password reset. The route is mounted with the
// shared `requestLimiter` + `authenticate('token')` chain in `before`;
// passport stashes the resolved user on `req.user` and this handler
// just persists the new password (the model hashes it on update).
async function handler({
  body,
  req,
}: Ctx<{ body: typeof schemas.ResetPasswordBody }>) {
  await service.resetPassword(req.user!, body.password);
}

export default defineAction({
  body: schemas.ResetPasswordBody,
  openapi: {
    summary: 'Replace the password using a reset token',
    responses: { 204: { description: 'No content' } },
  },
  handler,
});

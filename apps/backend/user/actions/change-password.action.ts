import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as service from '../user.service.ts';

// POST /users/me/change-password
// 400 when current = new (no-op refusal) or when `currentPassword` does
// not authenticate; 204 on success. We deliberately don't distinguish
// the two failure modes - revealing "wrong password" would be a free
// authentication oracle to anyone who's already past the cookie auth.
const Body = z.object({
  // No length floor: existing accounts may have any length the model allowed
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});
export type ChangePasswordBody = z.infer<typeof Body>;

async function handler({ body, user }: Ctx<{ body: typeof Body }>) {
  if (body.currentPassword === body.newPassword) {
    return createError(StatusCodes.BAD_REQUEST);
  }
  const ok = await service.changePassword(
    user,
    body.currentPassword,
    body.newPassword,
  );
  if (!ok) return createError(StatusCodes.BAD_REQUEST);
}

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Change the current user password',
    authenticated: true,
    responses: {
      204: { description: 'No content' },
      400: { description: 'Same password or wrong current password' },
    },
  },
  handler,
});

import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { Email, ShortText } from '#shared/request/schemas.ts';
import * as service from '../user.service.ts';

// PATCH /users/me
// Lets the current user update their own contact details. All fields
// are optional - the service only writes what's supplied.
// Email-uniqueness collisions surface as 409 (the model declares a
// unique constraint on `email`).
const Body = z.object({
  email: Email().optional(),
  firstName: ShortText(2, 50).optional(),
  lastName: ShortText(2, 50).optional(),
  // Generous ceiling: the FE sends a base64 data URL for the avatar
  // (250x250 compressed JPEG via the Avatar component). 200_000 chars
  // covers any reasonable upload while gating obvious DoS payloads.
  imgUrl: z.string().max(200_000).optional(),
});
export type ProfileUpdateBody = z.infer<typeof Body>;

async function handler({ body, user }: Ctx<{ body: typeof Body }>) {
  try {
    const profile = await service.updateProfile(user, body);
    return { user: profile };
  } catch (err) {
    // UniqueConstraintError extends ValidationError;
    // check the more specific branch first.
    if (err instanceof UniqueConstraintError) {
      const onEmail = err.errors?.some((e) => e.path === 'email');
      if (onEmail) {
        return createError(StatusCodes.CONFLICT, 'Email already in use');
      }
    }
    if (err instanceof ValidationError) {
      const message = err.errors?.[0]?.message ?? 'Invalid input';
      return createError(StatusCodes.BAD_REQUEST, message);
    }
    // Anything else (DB connection drop, unexpected throw) is a real
    // server fault - let the global error middleware handle it.
    throw err;
  }
}

export default defineAction({
  body: Body,
  raw: true,
  openapi: {
    summary: 'Update the current user profile',
    authenticated: true,
    responses: {
      200: { description: 'Updated profile' },
      409: { description: 'Email already in use' },
    },
  },
  handler,
});

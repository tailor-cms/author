import { StatusCodes } from 'http-status-codes';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../user.schema.ts';
import * as service from '../user.service.ts';

// PATCH /users/me
// Lets the current user update their own contact details. All fields
// are optional - the service only writes what's supplied.
// Email-uniqueness collisions surface as 409 (the model declares a
// unique constraint on `email`).
async function handler({
  body,
  user,
}: Ctx<{ body: typeof schemas.ProfileUpdateBody }>) {
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
  body: schemas.ProfileUpdateBody,
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

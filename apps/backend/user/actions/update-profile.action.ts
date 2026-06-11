import { StatusCodes } from 'http-status-codes';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

async function handler({
  body,
  user,
}: Ctx<{ body: typeof schemas.ProfileUpdateInput }>) {
  try {
    const profile = await service.updateProfile(user, body);
    return { user: profile };
  } catch (err) {
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
    // server fault; let the global error middleware handle it.
    throw err;
  }
}

export default defineAction({
  name: 'updateProfile',
  body: schemas.ProfileUpdateInput,
  raw: true,
  openapi: {
    authenticated: true,
    summary: 'Update the current user profile',
    responses: {
      200: {
        description: 'Updated profile.',
        schema: schemas.ProfileUpdateResult,
      },
      409: { description: 'Email already in use' },
    },
  },
  handler,
});

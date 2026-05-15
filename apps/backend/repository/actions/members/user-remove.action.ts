import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../../repository.service.ts';

// DELETE /repositories/:repositoryId/users/:userId
// Deletes the RepositoryUser row, revoking the user's access.
// `UserNotFoundError` from the service maps to 404. There is no
// "last repo admin" guard - system admins always retain access via
// `hasRepositoryAdminAccess`, so the repo is never orphaned.
const Params = z.object({
  // Numeric id of the user whose access is being revoked.
  userId: IntParam(),
});

async function handler(
  { params, req, res }: Ctx<{ params: typeof Params }>,
) {
  try {
    await service.removeUser(req.repository!, params.userId);
  } catch (err) {
    if (err instanceof service.UserNotFoundError) {
      return createError(StatusCodes.NOT_FOUND, err.message);
    }
    throw err;
  }
  res.end();
}

export default defineAction({
  params: Params,
  openapi: {
    summary: 'Remove a user from a repository',
    authenticated: true,
    responses: {
      200: { description: 'OK' },
      404: { description: 'User not found' },
    },
  },
  handler,
});

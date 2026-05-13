import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../../repository.service.ts';

// DELETE /repositories/:repositoryId/users/:userId
// Deletes the RepositoryUser row, revoking the user's access.
const Params = z.object({
  // Numeric id of the user whose access is being revoked.
  userId: IntParam(),
});

async function handler(
  { params, req, res }: Ctx<{ params: typeof Params }>,
) {
  const ok = await service.removeUser(req.repository!, params.userId);
  if (!ok) return createError(StatusCodes.NOT_FOUND, 'User not found');
  res.end();
}

export default defineAction({
  params: Params,
  openapi: {
    summary: 'Remove a user from a repository',
    authenticated: true,
    responses: { 200: { description: 'OK' }, 404: { description: 'User not found' } },
  },
  handler,
});

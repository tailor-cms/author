import { StatusCodes } from 'http-status-codes';

import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { createError } from '#shared/error/helpers.js';
import { RepositoryScopedParams } from '#shared/request/schemas.ts';

// POST /repositories/:repositoryId/comments/resolve
// Toggles the resolved state of a single comment or entire thread.
// Exactly one of `id` / `contentElementId` must be
// supplied; mapped to 400 via the typed domain error otherwise.
async function handler({
  body,
  req,
}: Ctx<{
  body: typeof schemas.ResolveInput;
  params: typeof RepositoryScopedParams;
}>) {
  try {
    await service.updateResolvement(req.repository!, body);
  } catch (err) {
    if (err instanceof service.InvalidResolveSelectorError) {
      return createError(StatusCodes.BAD_REQUEST, err.message);
    }
    throw err;
  }
}

export default defineAction({
  params: RepositoryScopedParams,
  body: schemas.ResolveInput,
  openapi: {
    authenticated: true,
    summary: 'Toggle the resolved state of a comment or element thread',
    description:
      'Toggle the resolved state for a single comment or entire thread.',
    responses: {
      204: { description: 'Resolved state toggled.' },
      400: { description: '`id` or `contentElementId` required.' },
    },
  },
  handler,
});

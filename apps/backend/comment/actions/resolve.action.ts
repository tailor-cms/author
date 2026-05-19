import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../comment.schema.ts';
import * as service from '../comment.service.ts';

// POST /repositories/:repositoryId/comments/resolve
// Toggles the resolved state.
async function handler({ body, req }: Ctx<{ body: typeof schemas.ResolveInput }>) {
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
  body: schemas.ResolveInput,
  openapi: {
    summary: 'Toggle the resolved state of a comment (or every comment on an element)',
    authenticated: true,
    responses: {
      204: { description: 'No content' },
      400: { description: 'id or contentElementId required' },
    },
  },
  handler,
});

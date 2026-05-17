import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../comment.service.ts';

// POST /repositories/:repositoryId/comments/resolve
// Toggles the resolved state.
const Body = z.object({
  // Single-comment selector.
  id: IntParam().optional(),
  // Bulk selector: every comment on the given element.
  contentElementId: IntParam().optional(),
  // Current `resolvedAt` (echoed back to flip): truthy -> unresolve,
  // absent/null -> resolve.
  resolvedAt: z.union([z.number(), z.iso.datetime(), z.null()]).optional(),
});
export type ResolveBody = z.infer<typeof Body>;

async function handler({ body, req }: Ctx<{ body: typeof Body }>) {
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
  body: Body,
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

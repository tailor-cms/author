import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { ShortText } from '#shared/request/schemas.ts';
import * as service from '../user-group.service.ts';

// PATCH /user-group/:id
// Updates mutable fields.
// 409 on a name collision with another group.
const Body = z.object({
  // New display name (2..250 chars).
  name: ShortText(2, 250).optional(),
  // New logo URL; data URL (see create for ceiling rationale).
  logoUrl: z.string().trim().max(200_000).optional(),
});
export type PatchBody = z.infer<typeof Body>;

async function handler({ body, req }: Ctx<{ body: typeof Body }>) {
  try {
    return await service.update(req.userGroup!, body);
  } catch (err) {
    if (err instanceof service.DuplicateNameError) {
      return createError(StatusCodes.CONFLICT, err.message);
    }
    throw err;
  }
}

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Patch a user group',
    authenticated: true,
    responses: {
      200: { description: 'Updated group' },
      409: { description: 'Group name already exists' },
    },
  },
  handler,
});

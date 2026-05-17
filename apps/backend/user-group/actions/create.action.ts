import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { ShortText } from '#shared/request/schemas.ts';
import * as service from '../user-group.service.ts';

// POST /user-group
// Creates a new user group. Admin-only (enforced by the route-level
// `authorize()` middleware). Name uniqueness is enforced by the DB
// constraint - the service maps the violation to `DuplicateNameError`
// which lands here as 409.
const Body = z.object({
  // Display name (2..250 chars to match the column-level validator).
  name: ShortText(2, 250),
  // Logo. Accepts a URL or a base64 data URL; ceiling mirrors the
  // user `imgUrl` cap (the fe Avatar component sends compressed JPEGs).
  logoUrl: z.string().trim().max(200_000).optional(),
});
export type CreateBody = z.infer<typeof Body>;

async function handler({ body }: Ctx<{ body: typeof Body }>) {
  try {
    return await service.create(body);
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
    summary: 'Create a user group (admin)',
    authenticated: true,
    responses: {
      200: { description: 'Created group' },
      409: { description: 'Group name already exists' },
    },
  },
  handler,
});

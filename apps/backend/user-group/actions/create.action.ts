import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../user-group.schema.ts';
import * as service from '../user-group.service.ts';

// POST /user-group
// Creates a new user group. Admin-only (enforced by the route-level
// `authorize()` middleware). Name uniqueness is enforced by the DB
// constraint - the service maps the violation to `DuplicateNameError`
// which lands here as 409.
async function handler({ body }: Ctx<{ body: typeof schemas.CreateBody }>) {
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
  body: schemas.CreateBody,
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

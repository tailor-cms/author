import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../user-group.schema.ts';
import * as service from '../user-group.service.ts';

// PATCH /user-group/:id
// Updates mutable fields.
// 409 on a name collision with another group.
async function handler({ body, req }: Ctx<{ body: typeof schemas.PatchInput }>) {
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
  body: schemas.PatchInput,
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

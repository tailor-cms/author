import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user-group.service.ts';

async function handler({ body }: Ctx<{ body: typeof schemas.CreateInput }>) {
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
  body: schemas.CreateInput,
  openapi: {
    authenticated: true,
    summary: 'Create a user group (admin)',
    responses: {
      200: {
        description: 'Created group.',
        schema: dataEnvelope(schemas.UserGroup),
      },
      409: { description: 'Group name already exists' },
    },
  },
  handler,
});

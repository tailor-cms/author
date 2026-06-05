import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

export default defineAction({
  params: schemas.UserItemParams,
  openapi: {
    authenticated: true,
    summary: 'Remove a user (admin)',
    responses: {
      204: { description: 'No content' },
      409: { description: 'Cannot remove the last system admin' },
    },
  },
  async handler({ params }) {
    try {
      await service.remove(params.id);
    } catch (err) {
      if (err instanceof service.LastSystemAdminError) {
        return createError(StatusCodes.CONFLICT, err.message);
      }
      throw err;
    }
  },
});

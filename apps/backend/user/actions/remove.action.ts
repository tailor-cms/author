import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../user.schema.ts';
import * as service from '../user.service.ts';

// DELETE /users/:id
// Admin-driven user removal. Soft-delete via the model's paranoid mode.
// `LastSystemAdminError` from the service maps to 409.
export default defineAction({
  params: schemas.RemoveParams,
  openapi: {
    summary: 'Remove a user (admin)',
    authenticated: true,
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

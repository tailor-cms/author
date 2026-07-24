import { StatusCodes } from 'http-status-codes';
import { audit } from '#shared/audit.ts';
import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

export default defineAction({
  params: schemas.UserItemParams,
  openapi: {
    authenticated: true,
    summary: 'Remove a user',
    responses: {
      204: { description: 'No content' },
      409: { description: 'Cannot remove the last system admin' },
    },
  },
  async handler({ params, user }) {
    try {
      await service.remove(params.id);
      audit('user:remove', 'success', {
        userId: params.id,
        actorId: user.id,
      });
    } catch (err) {
      if (err instanceof service.LastSystemAdminError) {
        return createError(StatusCodes.CONFLICT, err.message);
      }
      throw err;
    }
  },
});

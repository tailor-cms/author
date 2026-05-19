import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../../user-group.schema.ts';
import * as service from '../../user-group.service.ts';

// DELETE /user-group/:id/users/:userId
// Removes a user from the group. 404 when the user id is unknown.
async function handler({
  params,
  req,
}: Ctx<{ params: typeof schemas.RemoveMemberParams }>) {
  try {
    await service.removeMember(req.userGroup!, params.userId);
  } catch (err) {
    if (err instanceof service.MemberUserNotFoundError) {
      return createError(StatusCodes.NOT_FOUND, err.message);
    }
    throw err;
  }
}

export default defineAction({
  params: schemas.RemoveMemberParams,
  openapi: {
    summary: 'Remove a member from a user group',
    authenticated: true,
    responses: {
      204: { description: 'No content' },
      404: { description: 'User not found' },
    },
  },
  handler,
});

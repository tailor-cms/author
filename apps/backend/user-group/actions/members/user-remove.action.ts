import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../../schemas/index.ts';
import * as service from '../../user-group.service.ts';

async function handler({
  params,
  req,
}: Ctx<{ params: typeof schemas.MemberItemParams }>) {
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
  params: schemas.MemberItemParams,
  openapi: {
    authenticated: true,
    summary: 'Remove a member from a user group',
    responses: {
      204: { description: 'No content' },
      403: { description: 'Caller is not an admin or group admin' },
      404: { description: 'User group or member user not found' },
    },
  },
  handler,
});

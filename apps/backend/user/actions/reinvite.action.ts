import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

async function handler({
  params,
}: Ctx<{ params: typeof schemas.UserItemParams }>) {
  const user = await service.reinvite(params.id);
  if (!user) return createError(StatusCodes.NOT_FOUND, 'User does not exist!');
}

export default defineAction({
  params: schemas.UserItemParams,
  status: StatusCodes.ACCEPTED,
  openapi: {
    authenticated: true,
    summary: 'Resend the invitation mail to a user (admin)',
    responses: {
      202: { description: 'Accepted' },
      404: { description: 'User not found' },
    },
  },
  handler,
});

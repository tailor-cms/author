import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../user.schema.ts';
import * as service from '../user.service.ts';

// POST /users/:id/reinvite
// Admin-driven re-send of the invitation mail. 202 on success (the mail
// is fire-and-forget); 404 if the user id is unknown.
async function handler({
  params,
}: Ctx<{ params: typeof schemas.ReinviteParams }>) {
  const user = await service.reinvite(params.id);
  if (!user) return createError(StatusCodes.NOT_FOUND, 'User does not exist!');
}

export default defineAction({
  params: schemas.ReinviteParams,
  status: StatusCodes.ACCEPTED,
  openapi: {
    summary: 'Resend the invitation mail to a user (admin)',
    authenticated: true,
    responses: {
      202: { description: 'Accepted' },
      404: { description: 'User not found' },
    },
  },
  handler,
});

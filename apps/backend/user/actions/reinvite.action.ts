import { StatusCodes } from 'http-status-codes';
import { audit } from '#shared/audit.ts';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../user.service.ts';

async function handler({
  params,
  user: actor,
}: Ctx<{ params: typeof schemas.UserItemParams }>) {
  const user = await service.reinvite(params.id);
  if (!user) return createError(StatusCodes.NOT_FOUND, 'User does not exist!');
  // Re-sending an invite mails a fresh setup token, so it is audited like
  // the other account-administration events.
  audit('user:reinvite', 'success', {
    userId: user.id,
    email: user.email,
    actorId: actor.id,
  });
}

export default defineAction({
  name: 'reinvite',
  params: schemas.UserItemParams,
  status: StatusCodes.ACCEPTED,
  openapi: {
    authenticated: true,
    summary: 'Resend the invitation mail to a user',
    responses: {
      202: { description: 'Accepted' },
      404: { description: 'User not found' },
    },
  },
  handler,
});

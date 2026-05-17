import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../user.service.ts';

// POST /users/:id/reinvite
// Admin-driven re-send of the invitation mail. 202 on success (the mail
// is fire-and-forget); 404 if the user id is unknown.
const Params = z.object({
  id: IntParam(),
});

async function handler({ params }: Ctx<{ params: typeof Params }>) {
  const user = await service.reinvite(params.id);
  if (!user) return createError(StatusCodes.NOT_FOUND, 'User does not exist!');
}

export default defineAction({
  params: Params,
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

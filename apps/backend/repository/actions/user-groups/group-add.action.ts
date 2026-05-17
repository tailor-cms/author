import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/user-group
// Shares the repository with the given user group.
const Body = z.object({
  // Numeric id of the UserGroup to share with.
  userGroupId: z.number().int().positive(),
});
export type AddUserGroupBody = z.infer<typeof Body>;

async function handler({ body, req }: Ctx<{ body: typeof Body }>) {
  const userGroup = await service.addUserGroup(req.repository!, body.userGroupId);
  if (!userGroup) return createError(StatusCodes.NOT_FOUND, 'User group not found');
  return userGroup;
}

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Share repository with a user group',
    authenticated: true,
  },
  handler,
});

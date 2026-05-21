import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../../repository.schema.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/user-group
// Shares the repository with the given user group.
async function handler({
  body,
  req,
}: Ctx<{ body: typeof schemas.AddUserGroupInput }>) {
  const userGroup = await service.addUserGroup(req.repository!, body.userGroupId);
  if (!userGroup) return createError(StatusCodes.NOT_FOUND, 'User group not found');
  return userGroup;
}

export default defineAction({
  body: schemas.AddUserGroupInput,
  openapi: {
    summary: 'Share repository with a user group',
    authenticated: true,
  },
  handler,
});

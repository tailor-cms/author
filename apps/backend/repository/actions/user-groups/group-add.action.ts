import { StatusCodes } from 'http-status-codes';
import { oneLine } from 'common-tags';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../../schemas/index.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/user-group
// Shares the repository with the given user group.
async function handler({
  body,
  req,
}: Ctx<{
  body: typeof schemas.AddUserGroupInput;
  params: typeof schemas.RepositoryItemParams;
}>) {
  const userGroup = await service.addUserGroup(
    req.repository!,
    body.userGroupId,
  );
  if (!userGroup)
    return createError(StatusCodes.NOT_FOUND, 'User group not found');
  return userGroup;
}

export default defineAction({
  name: 'addUserGroup',
  params: schemas.RepositoryItemParams,
  body: schemas.AddUserGroupInput,
  openapi: {
    authenticated: true,
    summary: 'Share repository with a user group',
    description: oneLine`
      Grants every member of the user group access to this repository.
      Idempotent: returns the existing membership if the group is
      already attached.
    `,
  },
  handler,
});

// Wire shapes for the repository / user-group association endpoints.
import { z } from 'zod';

import {
  Int,
  IntParam,
  RepositoryScopedParams,
} from '#shared/request/schemas.ts';

// POST /repositories/:repositoryId/user-group
export const AddUserGroupInput = z
  .object({
    userGroupId: Int().describe('Numeric id of the user group.'),
  })
  .describe('Share the repository with a user group.');

export type AddUserGroupInput = z.infer<typeof AddUserGroupInput>;

// Path params for `/:repositoryId/user-group/:userGroupId`.
export const UserGroupItemParams = RepositoryScopedParams.extend({
  userGroupId: IntParam().describe(
    'Numeric id of the user group.',
  ),
});

export type UserGroupItemParams = z.infer<typeof UserGroupItemParams>;

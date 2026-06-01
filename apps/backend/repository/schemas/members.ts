// Wire shapes for the repository-member endpoints (users with access).
import { z } from 'zod';

import {
  Email,
  IntParam,
  RepositoryScopedParams,
} from '#shared/request/schemas.ts';
import { RepositoryMember, RepositoryUser } from './entity.ts';

// POST /repositories/:repositoryId/users
export const UpsertUserInput = z
  .object({
    email: Email().describe('Invitee email; lower-cased + trimmed.'),
    role: RepositoryUser.shape.role,
  })
  .describe('Invite a new user or update an existing user role.');

export type UpsertUserInput = z.infer<typeof UpsertUserInput>;

export const UpsertUserResult = z
  .object({ user: RepositoryMember })
  .meta({ id: 'RepositoryMemberUpsertResult' })
  .describe('Upserted repository member.');

export type UpsertUserResult = z.infer<typeof UpsertUserResult>;

// Path params for every `/:repositoryId/users/:userId` route
export const MemberItemParams = RepositoryScopedParams.extend({
  userId: IntParam().describe(`Numeric id of the user.`),
});

export type MemberItemParams = z.infer<typeof MemberItemParams>;

// UserGroup entity and its related sub-shapes.
import { UserRole } from '@tailor-cms/interfaces/role';
import { z } from 'zod';

import {
  Int,
  IntParam,
  ShortText,
} from '#shared/request/schemas.ts';
import { User } from '#app/user/schemas/entity.ts';

// Re-export the role enum
export { UserRole };

// Path param shape for every `/user-group/:id` route.
export const UserGroupItemParams = z.object({
  id: IntParam().describe('Numeric user-group id.'),
});

export type UserGroupItemParams = z.infer<typeof UserGroupItemParams>;

// Path param shape for `/user-group/:id/users/:userId`.
export const MemberItemParams = UserGroupItemParams.extend({
  userId: IntParam().describe('Numeric id of the group member.'),
});

export type MemberItemParams = z.infer<typeof MemberItemParams>;

// Roles assignable on a UserGroupMember row
export const UserGroupMemberRole = z
  .enum([UserRole.ADMIN, UserRole.COLLABORATOR, UserRole.USER])
  .describe('Group-scoped role (ADMIN | COLLABORATOR | USER).');

export const UserGroup = z
  .object({
    id: Int().describe('Numeric primary key.'),
    name: ShortText(2, 250).describe(
      'Display name (2..250 chars; unique across groups).',
    ),
    logoUrl: z
      .string()
      .trim()
      .max(200_000)
      .nullable()
      .describe(`
        Logo URL or base64 data URL. Capped at 200_000 chars to match the
        ceiling on user avatars.
      `),
  })
  .meta({ id: 'UserGroup' })
  .describe('A workspace user group; repositories are shared with groups.');

export type UserGroup = z.infer<typeof UserGroup>;

// Join row connecting a User to a UserGroup with a role.
export const UserGroupMember = z
  .object({
    userId: Int().describe('User id.'),
    groupId: Int().describe('Group id.'),
    role: UserGroupMemberRole,
  })
  .meta({ id: 'UserGroupMember' })
  .describe(`Join row granting a user membership in a group with a role.`);

export type UserGroupMember = z.infer<typeof UserGroupMember>;

// Group-member row returned by GET /user-group/:id/users
export const GroupMember = User
  .extend({
    userGroupMember: UserGroupMember.describe(
      `Join row for this member; carries the group-scoped role.`,
    ),
  })
  .meta({ id: 'UserGroupMemberWithUser' })
  .describe('A user-group member: full user profile + join row.');

export type GroupMember = z.infer<typeof GroupMember>;

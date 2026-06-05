import { Email, Int, IntParam, ShortText } from '#shared/request/schemas.ts';
import { UserRole } from '@tailor-cms/interfaces/role';
import { oneLine } from 'common-tags';
import { z } from 'zod';

// Path param shape for every `/users/:id` route
export const UserItemParams = z.object({
  id: IntParam().describe('Numeric user id (path param).'),
});

export type UserItemParams = z.infer<typeof UserItemParams>;

// Re-export the role for convenience
export { UserRole };

// The full User entity as returned by the API. Mirrors the `profile`
// virtual on the User model (password is excluded by the default scope).
export const User = z
  .object({
    id: Int().describe('Numeric primary key.'),
    email: Email().describe('Account email; lower-cased + trimmed.'),
    role: z.enum(UserRole).describe('System-level role.'),
    firstName: ShortText(2, 50)
      .nullable()
      .describe('First name (2..50 chars when present).'),
    lastName: ShortText(2, 50)
      .nullable()
      .describe('Last name (2..50 chars when present).'),
    fullName: z
      .string()
      .nullable()
      .describe('Computed full name; null when both names are unset.'),
    label: z.string().describe(oneLine`
      Display label fallback. Resolves to \`fullName\` when present,
      otherwise the email; safe to render directly.
    `),
    imgUrl: z.string().describe(oneLine`
      Avatar URL. Defaults to a Gravatar identicon derived from the
      email when no custom image was uploaded.
    `),
    createdAt: z.iso
      .datetime({ offset: true })
      .describe('Insertion timestamp.'),
    updatedAt: z.iso
      .datetime({ offset: true })
      .describe('Last mutation timestamp.'),
    deletedAt: z.iso
      .datetime({ offset: true })
      .nullable()
      .describe('Soft-delete timestamp; null while active.'),
  })
  .meta({ id: 'User' })
  .describe('A system user; the shape returned by the `profile` virtual.');

export type User = z.infer<typeof User>;

// Attribute list for the slim user projection. Used by Sequelize
// `attributes: [...]` includes wherever a User is eager-loaded as the
// author / uploader / assignee of another record (revisions, comments,
// activity-status, repository member rows, etc.). Kept in sync with the
// `UserSummary` Zod shape below.
export const USER_SUMMARY_ATTRS = [
  'id',
  'email',
  'firstName',
  'lastName',
  'fullName',
  'label',
  'imgUrl',
] as const;

// Slim user projection attached to records that include the author /
// uploader / assignee user. Derived from the full `User` entity so the
// summary is guaranteed to stay aligned with the source shape.
export const UserSummary = User.pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  fullName: true,
  label: true,
  imgUrl: true,
})
  .meta({ id: 'UserSummary' })
  .describe('Slim user projection attached to records that include the user.');

export type UserSummary = z.infer<typeof UserSummary>;

export const AccessibleUserGroup = z
  .object({
    id: Int().describe('User-group id.'),
    name: z.string().describe('User-group display name.'),
    role: z.enum(UserRole).describe(`Acting user's role within the group.`),
  })
  .meta({ id: 'AccessibleUserGroup' })
  .describe(`A user group decorated with the acting user's role.`);

export type AccessibleUserGroup = z.infer<typeof AccessibleUserGroup>;

// Wire shape for the admin user-listing endpoint.
import { z } from 'zod';
import {
  Pagination,
  QueryBoolean,
  Sort,
  UInt,
} from '#shared/request/schemas.ts';
import { User } from './entity.ts';
import { UserRole } from '@tailor-cms/interfaces/role';

export const ListFilter = z
  .object({
    filter: z
      .string()
      .trim()
      .max(250)
      .optional()
      .describe('Substring match across email, firstName, lastName (iLike).'),
    email: z.string().trim().max(250).optional().describe(`
      Exact-equality match against User.email. Kept as a plain string
      (not validated as a real address) so a typo from the search box
      returns zero results instead of a 400.
    `),
    role: z.enum(UserRole).optional().describe('Restrict to a specific role.'),
    archived: QueryBoolean.optional().describe(
      'Include soft-deleted (archived) users in the result.',
    ),
    ...Pagination(),
    ...Sort(),
  })
  .describe('Filters, pagination, and sort for listing users.');

export type ListFilter = z.infer<typeof ListFilter>;

// A user row in the list response. Decorates the base entity with the
// eager-loaded user-group membership rows.
export const UserListItem = User.extend({
  userGroups: z
    .array(z.unknown())
    .optional()
    .describe('Eager-loaded user-group membership rows attached to this user.'),
})
  .meta({ id: 'UserListItem' })
  .describe('User row in the admin list response.');

export type UserListItem = z.infer<typeof UserListItem>;

// Top-level response envelope for the list endpoint.
export const ListResult = z
  .object({
    items: z.array(UserListItem).describe('Page of users matching the filter.'),
    total: UInt().describe('Total users matching the filter.'),
  })
  .meta({ id: 'UserListResult' })
  .describe('Paginated user list response.');

export type ListResult = z.infer<typeof ListResult>;

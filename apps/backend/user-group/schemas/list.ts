// Wire shape for the user-group listing endpoint.
import { z } from 'zod';
import {
  Int,
  Paginated,
  Pagination,
  Sort,
} from '#shared/request/schemas.ts';
import { UserGroup } from './entity.ts';

export const ListFilter = z
  .object({
    filter: z
      .string()
      .trim()
      .max(100)
      .optional()
      .describe('Substring match against group name (iLike).'),
    ...Pagination(),
    ...Sort(),
  })
  .describe('Filters, pagination, and sort for listing user groups.');

export type ListFilter = z.infer<typeof ListFilter>;

// List rows carry aggregate counts (computed via subqueries) so the
// listing UI can show group size without extra requests.
export const UserGroupWithCounts = UserGroup.extend({
  memberCount: Int().describe('Number of members in the group.'),
  repositoryCount: Int().describe(
    'Number of repositories shared with the group.',
  ),
})
  .meta({ id: 'UserGroupWithCounts' })
  .describe('A user group decorated with member and repository counts.');

export type UserGroupWithCounts = z.infer<typeof UserGroupWithCounts>;

export const ListResult = Paginated(UserGroupWithCounts, 'UserGroupListResult')
  .describe('Paginated user-group list response.');

export type ListResult = z.infer<typeof ListResult>;

// Wire shape for the user-group listing endpoint.
import { z } from 'zod';
import { Pagination, Sort, UInt } from '#shared/request/schemas.ts';
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

export const ListResult = z
  .object({
    items: z
      .array(UserGroup)
      .describe('Page of user groups matching the filter.'),
    total: UInt().describe('Total groups matching the filter.'),
  })
  .meta({ id: 'UserGroupListResult' })
  .describe('Paginated user-group list response.');

export type ListResult = z.infer<typeof ListResult>;

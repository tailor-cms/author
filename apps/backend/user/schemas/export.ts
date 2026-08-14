// Wire shape for the admin user-export endpoint.
import type { z } from 'zod';
import { oneLine } from 'common-tags';
import { ListFilter } from './list.ts';
import { QueryBoolean } from '#shared/request/schemas.ts';

// Derived from `ListFilter` so the download always matches the filtered
// table the admin is looking at. Pagination and sort are dropped: an
// export is the complete match set, in a fixed order.
export const ExportFilter = ListFilter.omit({
  offset: true,
  limit: true,
  sortBy: true,
  sortOrder: true,
})
  .extend({
    includeUserGroups: QueryBoolean.optional().describe(oneLine`
      Append a "User groups" column listing each user's group
      memberships.
    `),
  })
  .describe('Filters and column options for the user CSV export.');

export type ExportFilter = z.infer<typeof ExportFilter>;

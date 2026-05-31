// Wire shape for the content-elements listing endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  IntArrayFromForm,
  Pagination,
  QueryBoolean,
  Sort,
} from '#shared/request/schemas.ts';

export const ListFilter = z
  .object({
    activityIds: IntArrayFromForm().describe(oneLine`
      Restrict to elements whose \`activityId\` is in the provided set
      (the FE's bulk "load every element under these containers" call).
      Accepts a real array, a single value, or a comma-separated string.
    `),
    detached: QueryBoolean.optional().describe(oneLine`
      Include detached elements (rows unreachable in the outline because
      an ancestor was deleted). Default: false.
    `),
    paranoid: QueryBoolean.optional().describe(oneLine`
      Set false to include soft-deleted rows.
    `),
    ...Pagination(),
    ...Sort(),
  })
  .describe(
    'Filters, pagination, and sort for listing repository content elements.',
  );

export type ListFilter = z.infer<typeof ListFilter>;

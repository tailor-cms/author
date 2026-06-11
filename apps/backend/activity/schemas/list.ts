// Wire shape for the activities listing endpoint.
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
    ids: IntArrayFromForm().describe(oneLine`
      Restrict to activities with these ids.
    `),
    detached: QueryBoolean.optional().describe(oneLine`
      Include detached items (rows unreachable in the outline because
      an ancestor was deleted). Default: false.
    `),
    outlineOnly: QueryBoolean.optional().describe(oneLine`
      Restrict to outline-level activities (those declared in
      the schema's outline structure). Adds the
      "published-but-not-yet-unpublished" carve-out so the FE can
      render pending-unpublish entries.
    `),
    paranoid: QueryBoolean.optional().describe(oneLine`
      Set false to include soft-deleted rows.
    `),
    ...Pagination(),
    ...Sort(),
  })
  .describe('Filters, pagination, and sort for listing repository activities.');

export type ListFilter = z.infer<typeof ListFilter>;

// Wire shape for the comments listing endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import {
  IntParam,
  Pagination,
  QueryBoolean,
  Sort,
} from '#shared/request/schemas.ts';

const SORT_COLUMNS = ['createdAt', 'updatedAt', 'resolvedAt'] as const;

export const ListFilter = z
  .object({
    activityId: IntParam().optional().describe(oneLine`
      Restrict to comments on a single activity (the activity-thread
      view).
    `),
    contentElementId: IntParam().optional().describe(oneLine`
      Restrict to comments on a single content element (the inline
      thread). May be combined with \`activityId\`; the client
      typically sends one or the other.
    `),
    paranoid: QueryBoolean.optional().describe(oneLine`
      Set false to include soft-deleted comments (default: true). The
      list route's default already opts into \`paranoid: false\` so
      deleted comments stay visible in the thread (their body renders
      as a placeholder via the model getter); this flag is exposed for
      completeness.
    `),
    ...Pagination(),
    ...Sort(SORT_COLUMNS),
  })
  .describe('Filters, pagination, and sort for listing repository comments.');

export type ListFilter = z.infer<typeof ListFilter>;

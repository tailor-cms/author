import {
  IntParam,
  Pagination,
  QueryBoolean,
  Sort,
} from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

const SORT_COLUMNS = ['createdAt', 'updatedAt', 'resolvedAt'] as const;

export const ListFilter = z
  .object({
    activityId: IntParam().optional().describe(oneLine`
      Only comments on this activity - the activity's own thread.
    `),
    contentElementId: IntParam().optional().describe(oneLine`
      Only comments on this content element - the inline thread in the
      editor.
    `),
    paranoid: QueryBoolean.optional().describe(oneLine`
      Set true to leave deleted comments out. They are included by
      default, so a reply keeps the message it was answering.
    `),
    ...Pagination(),
    ...Sort(SORT_COLUMNS),
  })
  .describe('Filters, paging and sort for the comment list.');

export type ListFilter = z.infer<typeof ListFilter>;

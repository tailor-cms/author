import {
  IntParam,
  Paginated,
  Pagination,
  ShortText,
} from '#shared/request/schemas.ts';
import { ThreadScope, ThreadType } from '@tailor-cms/interfaces/comment.ts';
import { ReaderThread } from './entity.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const ThreadFilter = z
  .object({
    type: z.enum(ThreadType).optional().describe('Narrow by thread type.'),
    activityId: IntParam().optional().describe(oneLine`
      Only threads anchored to this activity.
    `),
    name: ShortText(1, 200).optional().describe(oneLine`
      Matches a thread by its title or the name of the activity
      it is anchored to. To find what was *said* use search`),
    scope: z.enum(ThreadScope).optional().describe(oneLine`
      Which filter tab the rail is on: unread, mentions (of reader), still
      open, or ones the reader post in. Defaults to all.
    `),
    ...Pagination(),
  })
  .describe('Filters for the repository thread list.');

export type ThreadFilter = z.infer<typeof ThreadFilter>;

export const ThreadListResult = Paginated(
  ReaderThread,
  'CommentThreadListResult',
).describe('A page of threads.');

export type ThreadListResult = z.infer<typeof ThreadListResult>;

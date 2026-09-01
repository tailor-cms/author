import {
  Int,
  IntParam,
  RepositoryScopedParams,
  Timestamp,
  UInt,
  timestamps,
} from '#shared/request/schemas.ts';
import { ThreadActivity, ThreadElement } from '../../schemas/entity.ts';
import { ThreadScope, ThreadType } from '@tailor-cms/interfaces/comment.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

// Re-exported for convenience
export { ThreadScope, ThreadType };

// Path param for every `/threads/:threadId` route.
export const ThreadItemParams = RepositoryScopedParams.extend({
  threadId: IntParam().describe('Numeric thread id (path param).'),
});

export type ThreadItemParams = z.infer<typeof ThreadItemParams>;

export const Thread = z
  .object({
    id: Int(),
    repositoryId: Int().describe('Repository the thread belongs to.'),
    type: z.enum(ThreadType).describe(oneLine`
      The repository-level thread, or the comments left on an activity
      or a content element.
    `),
    // FK of the anchored thread
    activityId: Int().nullable(),
    contentElementId: Int().nullable(),
    // Null for anchored threads
    title: z.string().nullable(),
    // Denormalized participant ids for covenience
    participantIds: z.array(Int()),
    messageCount: UInt(),
    lastMessageAt: Timestamp().nullable(),
    subscriptions: z.array(z.string()).describe(oneLine`
      Integration sources this thread receives.
      Repository-level threads only; empty means
      nothing posts here but people.
    `),
    isResolved: z.boolean().describe(oneLine`
      True once an anchored thread's comments are all resolved. Always
      false for a repository-level thread, which is deleted rather than
      closed out.
    `),
    // Loaded anchors (if anchored thread)
    activity: ThreadActivity.nullable(),
    contentElement: ThreadElement.nullable(),
    ...timestamps(),
  })
  .meta({ id: 'Thread' })
  .describe('A thread inside a repository.');

export type Thread = z.infer<typeof Thread>;

// The thread plus the user specific fields
export const ReaderThread = Thread.extend({
  isUnread: z.boolean(),
  isStarred: z.boolean().describe('Starred by the reader'),
  lastReadAt: Timestamp().nullable(),
})
  .meta({ id: 'ReaderThread' })
  .describe('A thread as one reader sees it.');

export type ReaderThread = z.infer<typeof ReaderThread>;

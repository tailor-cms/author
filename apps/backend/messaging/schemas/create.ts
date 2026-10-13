import { Comment } from './entity.ts';
import { Int } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const CreateInput = z
  .object({
    activityId: Comment.shape.activityId.unwrap().optional().describe(oneLine`
      Activity the comment is on. Element comments carry it too, so they
      show up in the activity's thread; a repository-level message has
      neither.
    `),
    contentElementId: Comment.shape.contentElementId.unwrap().optional(),
    threadId: Int().optional().describe(oneLine`
      Thread to post into. Only needed for a repository-level thread -
      an anchored comment finds its own.
    `),
    parentId: Int().optional().describe(oneLine`
      Message this replies to. Replies are one level deep, so naming a
      reply here attaches to what that reply was answering.
    `),
    isBroadcast: z.boolean().optional().describe(oneLine`
      Also show the reply in the thread itself, not only under its
      parent. Only meaningful with \`parentId\`.
    `),
    content: Comment.shape.content,
  })
  .describe('A new message.');

export type CreateInput = z.infer<typeof CreateInput>;

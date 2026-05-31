// Wire shape for creating a comment.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Comment } from './entity.ts';

export const CreateInput = z
  .object({
    uid: Comment.shape.uid.optional(),
    activityId: Comment.shape.activityId.unwrap().describe(oneLine`
      Activity this comment belongs to; required for element-scoped
      comments so the activity-thread view sees them (outline activity id).
    `),
    contentElementId: Comment.shape.contentElementId.unwrap().optional(),
    content: Comment.shape.content,
  })
  .describe('Create comment payload.');

export type CreateInput = z.infer<typeof CreateInput>;

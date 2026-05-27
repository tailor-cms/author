// Wire shape for creating a comment.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Comment } from './entity.ts';

export const CreateInput = z
  .object({
    uid: Comment.shape.uid.optional().describe(oneLine`
      Client-generated uid. Optional; the model defaults to UUIDv4
      when absent.
    `),
    activityId: Comment.shape.activityId.unwrap().describe(oneLine`
      Activity this comment belongs to; required for element-scoped
      comments so the activity-thread view sees them (outline activity id).
    `),
    contentElementId: Comment.shape.contentElementId
      .unwrap()
      .optional()
      .describe('Element scope; absent for activity-level discussion.'),
    content: z.string().min(1).max(2000).describe(oneLine`
      Comment body. Length floor mirrors the model's \`len: [1, 2000]\`
      validator so obvious garbage is rejected at the wire boundary.
    `),
  })
  .describe('Create comment payload.');

export type CreateInput = z.infer<typeof CreateInput>;

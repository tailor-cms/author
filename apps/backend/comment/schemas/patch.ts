// Wire shape for the comment PATCH endpoint.
import { z } from 'zod';

import { Comment } from './entity.ts';

export const PatchInput = z
  .object({
    content: Comment.shape.content,
  })
  .describe('Patch payload for a comment update operation.');

export type PatchInput = z.infer<typeof PatchInput>;

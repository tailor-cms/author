import { Comment } from './entity.ts';
import { z } from 'zod';

export const PatchInput = z
  .object({ content: Comment.shape.content })
  .describe('New text for a comment.');

export type PatchInput = z.infer<typeof PatchInput>;

import { z } from 'zod';

export const ToggleReactionInput = z
  .object({
    emoji: z.string().min(1).max(32).describe('The emoji character.'),
  })
  .meta({ id: 'CommentToggleReactionInput' })
  .describe('A reaction to add, or to take back if it is already there.');

export type ToggleReactionInput = z.infer<typeof ToggleReactionInput>;

import { z } from 'zod';

export const SetStarredInput = z
  .object({
    isStarred: z.boolean().describe('Whether the reader has starred this thread.'),
  })
  .describe('Stars or unstars a thread for the calling user.');

export type SetStarredInput = z.infer<typeof SetStarredInput>;

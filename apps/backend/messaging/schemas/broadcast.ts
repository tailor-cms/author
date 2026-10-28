import { z } from 'zod';

export const SetBroadcastInput = z
  .object({
    isBroadcast: z
      .boolean()
      .describe('Whether the reply also shows in the thread.'),
  })
  .describe('Sends a reply to its thread, or takes it back out.');

export type SetBroadcastInput = z.infer<typeof SetBroadcastInput>;

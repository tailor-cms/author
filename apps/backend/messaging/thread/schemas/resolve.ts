import { z } from 'zod';

export const SetResolvedInput = z.object({
  resolved: z.boolean().describe('Target state; false reopens.'),
});

export type SetResolvedInput = z.infer<typeof SetResolvedInput>;

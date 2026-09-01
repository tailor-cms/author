import { z } from 'zod';

export const RemoveResult = z.object({ id: z.number() });

export type RemoveResult = z.infer<typeof RemoveResult>;

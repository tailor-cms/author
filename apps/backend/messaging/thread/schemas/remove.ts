import { Int } from '#shared/request/schemas.ts';
import { z } from 'zod';

export const RemoveResult = z
  .object({ id: Int() })
  .meta({ id: 'ThreadRemoveResult' })
  .describe('The thread that was deleted.');

export type RemoveResult = z.infer<typeof RemoveResult>;

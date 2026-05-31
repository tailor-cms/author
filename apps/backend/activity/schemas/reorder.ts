// Wire shape for the activity reorder endpoint.
import { z } from 'zod';

import { Activity } from './entity.ts';

export const ReorderInput = z
  .object({
    position: Activity.shape.position,
  })
  .describe('Reorder payload.');

export type ReorderInput = z.infer<typeof ReorderInput>;

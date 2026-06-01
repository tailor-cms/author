// Wire shape for adding a presence context.
import { z } from 'zod';

import { UserActivityContext } from './entity.ts';

export const AddInput = z
  .object({
    context: UserActivityContext.describe(
      'Focus context to attach to the current user.',
    ),
  })
  .describe('Add a presence context for the current user.');

export type AddInput = z.infer<typeof AddInput>;

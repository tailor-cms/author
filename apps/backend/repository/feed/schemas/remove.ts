// Wire shape for removing presence contexts.
import { z } from 'zod';

import { UserActivityContext } from './entity.ts';

export const RemoveInput = z
  .object({
    context: UserActivityContext.describe(
      'Context shape to match against the user’s stored contexts.',
    ),
  })
  .describe('Remove matching presence contexts for the current user.');

export type RemoveInput = z.infer<typeof RemoveInput>;

// Wire shape for the reference integrity endpoints.
import { z } from 'zod';

import {
  BrokenActivityReference,
  BrokenElementReference,
} from './entity.ts';

// POST /repositories/:repositoryId/references/cleanup
export const ReferenceCleanupInput = z
  .object({
    activities: z
      .array(BrokenActivityReference)
      .optional()
      .describe('Activities with dangling references to remove.'),
    elements: z
      .array(BrokenElementReference)
      .optional()
      .describe('Content elements with dangling references to remove.'),
  })
  .describe('Selection of dangling references to remove from the repository.');

export type ReferenceCleanupInput = z.infer<typeof ReferenceCleanupInput>;

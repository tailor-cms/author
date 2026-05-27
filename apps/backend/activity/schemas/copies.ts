// Response shape for the linked-copies enumeration endpoint.
import { z } from 'zod';

import { ActivityCopyLocation } from './entity.ts';

export const CopiesResult = z
  .object({
    copies: z
      .array(ActivityCopyLocation)
      .describe('Entry-point linked copies of this source activity.'),
  })
  .meta({ id: 'ActivityCopiesResult' })
  .describe('List of entry-point linked copies of a source activity.');

export type CopiesResult = z.infer<typeof CopiesResult>;

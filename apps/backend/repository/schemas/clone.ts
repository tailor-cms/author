// Wire shape for the repository clone endpoint.
import { z } from 'zod';

import { Repository } from './entity.ts';

export const CloneInput = z
  .object({
    name: Repository.shape.name,
    description: Repository.shape.description,
    shareWithSamePeople: z
      .boolean()
      .optional()
      .describe(
        'Share the clone with the same users and user groups as the source.',
      ),
  })
  .describe('Clone payload: target name + description for the new copy.');

export type CloneInput = z.infer<typeof CloneInput>;

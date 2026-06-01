// Wire shape for the repository PATCH endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Repository } from './entity.ts';

export const PatchInput = z
  .object({
    name: Repository.shape.name.optional(),
    description: Repository.shape.description.optional(),
    data: Repository.shape.data.optional().describe(oneLine`
      Replacement schema-meta blob (full replacement; FE merges before
      send). Server-managed fields are stripped in the service before
      persisting.
    `),
  })
  .describe('Patch payload for a repository update operation.');

export type PatchInput = z.infer<typeof PatchInput>;

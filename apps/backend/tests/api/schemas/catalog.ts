// Wire shape for the seed-catalog endpoint.
import { z } from 'zod';
import { UserGroupSpec } from './user.ts';

export const CatalogInput = z
  .object({
    userGroup: UserGroupSpec.optional(),
  })
  .describe('Optional user group to share the seeded catalog with.');

export type CatalogInput = z.infer<typeof CatalogInput>;

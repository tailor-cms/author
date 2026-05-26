import { z } from 'zod';

import { IntParam } from '#shared/request/schemas.ts';

export const BulkRemoveInput = z
  .object({
    assetIds: z
      .array(IntParam())
      .min(1)
      .describe('Numeric ids of the assets to soft-delete (at least one).'),
  })
  .describe('Selector for bulk asset deletion.');

export type BulkRemoveInput = z.infer<typeof BulkRemoveInput>;

// Only ids whose destroy() succeeded are returned. Failures are logged
// server-side and silently omitted from the response.
export const BulkRemoveResult = z
  .object({
    deletedIds: z
      .array(z.number().int())
      .describe('Subset of requested ids whose deletion succeeded.'),
  })
  .meta({ id: 'AssetBulkRemoveResult' })
  .describe('Successful deletions from a bulk-remove call.');

export type BulkRemoveResult = z.infer<typeof BulkRemoveResult>;

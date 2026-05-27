// Wire-shape contracts for the Indexing sub-router
import { ProcessingStatus } from '@tailor-cms/interfaces/asset.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Int, IntParam } from '#shared/request/schemas.ts';

// POST /repositories/:repositoryId/assets/indexing
export const IndexInput = z
  .object({
    assetIds: z
      .array(IntParam())
      .min(1)
      .max(100)
      .describe('Asset ids to enqueue for vector-store indexing (1..100).'),
  })
  .describe('Selector for the assets to index.');

export type IndexInput = z.infer<typeof IndexInput>;

// Response from the index endpoint when at least one eligible asset was
// claimed for indexing.
export const IndexResult = z
  .object({
    storeId: z
      .string()
      .describe('OpenAI vector store id used for this repository.'),
    assetIds: z.array(Int()).describe(oneLine`
      Subset of the requested ids that were eligible
      and queued for processing.
    `),
  })
  .meta({ id: 'AssetIndexResult' })
  .describe('Acknowledgement of an indexing job, returned synchronously.');

export type IndexResult = z.infer<typeof IndexResult>;

// One asset's vector-store indexing state. Shared by the list endpoint
// (one entry per indexed asset) and the per-asset endpoint (0 or 1
// entry depending on whether the asset has ever been indexed).
export const StatusItem = z
  .object({
    id: Int().describe('Asset id.'),
    processingStatus: z
      .enum(ProcessingStatus)
      .nullable()
      .describe('Current indexing state; null if never indexed.'),
    vectorStoreFileId: z.string().nullable().describe(oneLine`
      OpenAI File API id once indexing completes;
      null until then.
    `),
  })
  .meta({ id: 'AssetIndexStatusItem' })
  .describe(`One asset's vector-store indexing state.`);

export type StatusItem = z.infer<typeof StatusItem>;

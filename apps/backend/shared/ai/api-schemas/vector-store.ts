// Wire shapes for vector-store path-param routes.
import { z } from 'zod';

export const VectorStoreItemParams = z
  .object({
    vectorStoreId: z
      .string()
      .min(1)
      .describe('OpenAI vector store id (e.g. `vs_abc123`).'),
  })
  .describe('Path params for vector store scoped endpoints.');

export type VectorStoreItemParams = z.infer<typeof VectorStoreItemParams>;

// Per-file processing status as returned by the status endpoint.
const VectorStoreFileStatus = z
  .object({
    fileId: z.string().describe('OpenAI file id.'),
    status: z.string().describe('OpenAI file processing state.'),
  })
  .meta({ id: 'AiVectorStoreFileStatus' });

export const VectorStoreStatus = z
  .object({
    isReady: z
      .boolean()
      .describe('True when every file has reached the `completed` state.'),
    isFailed: z
      .boolean()
      .describe('True when at least one file is in the `failed` state.'),
    files: z
      .array(VectorStoreFileStatus)
      .describe('Per-file processing state.'),
  })
  .meta({ id: 'AiVectorStoreStatus' })
  .describe('Vector store processing status.');

export type VectorStoreStatus = z.infer<typeof VectorStoreStatus>;

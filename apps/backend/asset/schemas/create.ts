// No body schema: every input arrives via multer (multipart).
// The two upload modes (asset-library multi-file via `files[]`, legacy CE
// single-file via `file`) produce different response shapes that share
// this single route. Both branches are documented via `z.union` so OpenAPI
// emits a `oneOf` 200 response.
import { z } from 'zod';

import { dataEnvelope } from '#shared/request/schemas.ts';

import { Asset } from './entity.ts';

// Modern library upload - N assets created, returned in the standard
// `{ data: [...] }` envelope.
export const LibraryUploadResult = dataEnvelope(z.array(Asset))
  .describe('Library upload response shape, with an array of created Assets.');

export type LibraryUploadResult = z.infer<typeof LibraryUploadResult>;

// Legacy content-element single-file upload
// Kept for backward compatibility with existing content element API
export const LegacyUploadResult = z
  .object({
    key: z.string().describe('Storage key of the uploaded file.'),
    publicUrl: z.string().describe('Pre-signed public URL for the file.'),
    url: z.string().describe('storage:// protocol internal URL.'),
  })
  .meta({ id: 'AssetLegacyUploadResult' })
  .describe('Legacy single-file upload response shape.');

export type LegacyUploadResult = z.infer<typeof LegacyUploadResult>;

// Combined 200 response shape; emitted as `oneOf` in the OpenAPI spec.
export const CreateResponse = z
  .union([LibraryUploadResult, LegacyUploadResult])
  .describe('Library upload response OR legacy single-file upload response.');

export type CreateResponse = z.infer<typeof CreateResponse>;

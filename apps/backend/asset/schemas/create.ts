// No body schema: every input arrives via multer (multipart).
// The two upload modes (asset-library multi-file via `files[]`, legacy CE
// single-file via `file`) produce different response shapes that share
// this single route. Both branches are documented via `z.union` so OpenAPI
// emits a `oneOf` 200 response.
import { z } from 'zod';

import {
  binaryFile,
  binaryFileArray,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { Asset, FolderPath, StorageRef } from './entity.ts';

// Two upload modes share the route; the handler branches on which field
// carried the upload.
export const CreateMultipart = z
  .object({
    files: binaryFileArray('Library upload: multiple assets (max 10).')
      .optional(),
    file: binaryFile('Legacy single-file upload.')
      .optional(),
    folder: FolderPath.optional().describe(
      'Virtual folder path for the uploaded assets.',
    ),
  })
  .describe('Asset upload payload; use `files[]` (library) OR `file` (legacy).');

// Modern library upload - N assets created, returned in the standard
// `{ data: [...] }` envelope.
export const LibraryUploadResult = dataEnvelope(z.array(Asset))
  .describe('Library upload response shape, with an array of created Assets.');

export type LibraryUploadResult = z.infer<typeof LibraryUploadResult>;

// Legacy content-element single-file upload. Kept for backward
// compatibility with the existing content element API.
export const LegacyUploadResult = StorageRef
  .meta({ id: 'AssetLegacyUploadResult' })
  .describe('Legacy single-file upload response shape.');

export type LegacyUploadResult = z.infer<typeof LegacyUploadResult>;

// Combined 200 response shape; emitted as `oneOf` in the OpenAPI spec.
export const CreateResponse = z
  .union([LibraryUploadResult, LegacyUploadResult])
  .describe('Library upload response OR legacy single-file upload response.');

export type CreateResponse = z.infer<typeof CreateResponse>;

import { oneLine } from 'common-tags';
import { StatusCodes } from 'http-status-codes';

import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';

// POST /repositories/:repositoryId/assets
// Unified upload route with two response shapes driven by which multer
// field carried the upload:
//   - `files[]` (asset library)         -> { data: Asset[] }
//   - `file`    (legacy file upload)   -> { key, publicUrl, url }
// `raw: true` so the handler returns the chosen shape verbatim.
export default defineAction({
  name: 'uploadAssets',
  raw: true,
  multipart: schemas.CreateMultipart,
  openapi: {
    authenticated: true,
    summary: 'Upload one or more assets',
    description: oneLine`
      Multipart upload. Use the \`files[]\` field for asset-library uploads
      (returns the standard data envelope) or the legacy \`file\` field for
      content-element single-file uploads (returns the storage-key shape).
    `,
    responses: {
      200: {
        description: 'Library data envelope OR legacy storage-key shape.',
        schema: schemas.CreateResponse,
      },
      400: { description: 'No files provided in the multipart body.' },
    },
  },
  async handler({ req }) {
    const { file: [storageFile] = [], files: libraryFiles = [] } =
      (req.files as Record<string, any[]>) ?? {};
    const files = storageFile ? [storageFile] : libraryFiles;
    if (!files.length) {
      return createError(StatusCodes.BAD_REQUEST, 'No files provided');
    }
    const assets = await service.upload(
      req.repository!.id,
      req.user!.id,
      files,
    );
    if (storageFile) return service.getDownloadUrl(assets[0].storageKey!);
    return { data: assets };
  },
});

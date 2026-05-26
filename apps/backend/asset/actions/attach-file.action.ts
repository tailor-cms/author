import { oneLine } from 'common-tags';
import { StatusCodes } from 'http-status-codes';

import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';

// POST /repositories/:repositoryId/assets/:assetId/file
// Attach a supplementary file under a `meta.files[fileKey]` slot. The
// file itself is parsed upstream by multer (single-field upload); the
// body carries only the slot name.
export default defineAction({
  params: schemas.AssetItemParams,
  body: schemas.AttachFileInput,
  openapi: {
    authenticated: true,
    summary: 'Attach a supplementary file to an asset',
    description: oneLine`
      Stores the multipart \`file\` under \`meta.files[fileKey]\`. Replaces
      any previously attached file at the same slot; the old file is left
      in storage since published content may still reference it.
    `,
    responses: {
      200: {
        description: 'Asset row with the updated `meta.files` map.',
        schema: dataEnvelope(schemas.Asset),
      },
      400: { description: 'No file provided in the multipart body.' },
      404: { description: 'Asset not found in this repository.' },
    },
  },
  async handler({ body, req }) {
    if (!req.file) {
      return createError(StatusCodes.BAD_REQUEST, 'No file provided');
    }
    return service.attachFile(req.asset!, body.fileKey, req.file as any);
  },
});

import { StatusCodes } from 'http-status-codes';

import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';

// GET /repositories/:repositoryId/assets/:assetId/download
// Pre-signed download URL for file-based assets. LINK assets have no
// stored binary, so 400 is the correct response.
export default defineAction({
  name: 'downloadAsset',
  params: schemas.AssetItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get a signed download URL for an asset',
    description: 'Only applies to assets with a stored file (not LINK).',
    responses: {
      200: {
        description: 'Signed URL for the asset file.',
        schema: dataEnvelope(schemas.DownloadResult),
      },
      400: { description: 'Asset has no downloadable file (LINK type).' },
      404: { description: 'Asset not found in this repository.' },
    },
  },
  async handler({ req }) {
    const asset = req.asset!;
    if (!asset.storageKey) {
      const msg = `Asset ${asset.id} has no storageKey`;
      return createError(StatusCodes.BAD_REQUEST, msg);
    }
    const { publicUrl } = await service.getDownloadUrl(asset.storageKey);
    return { url: publicUrl };
  },
});

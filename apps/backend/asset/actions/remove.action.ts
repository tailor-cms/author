import { oneLine } from 'common-tags';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';

// DELETE /repositories/:repositoryId/assets/:assetId
// Soft-deletes the asset row; storage files are intentionally retained
// because published content elements may still hold storage:// references.
export default defineAction({
  params: schemas.AssetItemParams,
  openapi: {
    authenticated: true,
    summary: 'Soft-delete an asset',
    description: oneLine`
      Soft-deletes the asset row and removes it from the vector store
      (if applicable). The underlying storage file is kept so content
      references stay valid.`,
    responses: {
      200: {
        description: 'The soft-deleted asset (with `deletedAt` set).',
        schema: dataEnvelope(schemas.Asset),
      },
      404: { description: 'Asset not found in this repository.' },
    },
  },
  async handler({ req }) {
    return service.remove(req.repository!, req.asset!);
  },
});

import { oneLine } from 'common-tags';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../../schemas/index.ts';
import * as service from '../indexing.service.ts';

// DELETE /repositories/:repositoryId/assets/indexing/:assetId
// Removes the asset from the vector store and clears the local status.
export default defineAction({
  params: schemas.AssetItemParams,
  openapi: {
    authenticated: true,
    summary: 'Deindex an asset',
    description: oneLine`
      Removes the asset's file from the OpenAI vector store and clears
      \`processingStatus\` / \`vectorStoreFileId\` locally.
    `,
    responses: {
      200: {
        description: 'Asset row after status reset.',
        schema: dataEnvelope(schemas.Asset),
      },
      404: { description: 'Asset not found in this repository.' },
    },
  },
  async handler({ req }) {
    return service.deindex(req.repository!, req.asset!);
  },
});

import { oneLine } from 'common-tags';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';

// POST /repositories/:repositoryId/assets/bulk/remove
// Soft-deletes the listed assets. Failures are logged server-side
// and silently omitted from the returned deletedIds.
export default defineAction({
  body: schemas.BulkRemoveInput,
  openapi: {
    authenticated: true,
    summary: 'Bulk soft-delete assets',
    description: oneLine`
      Soft-deletes each asset by id. Failures are logged and the request
      never partials out — the response contains the ids that did delete.
    `,
    responses: {
      200: {
        description: 'Subset of requested ids whose deletion succeeded.',
        schema: dataEnvelope(schemas.BulkRemoveResult),
      },
    },
  },
  async handler({ body, req }) {
    const deletedIds = await service.bulkRemove(req.repository!, body.assetIds);
    return { deletedIds };
  },
});

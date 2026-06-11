import { oneLine } from 'common-tags';
import { z } from 'zod';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as assetSchemas from '../../schemas/index.ts';
import * as schemas from '../indexing.schema.ts';
import * as service from '../indexing.service.ts';

// GET /repositories/:repositoryId/assets/indexing/:assetId/status
// Per-asset indexing status.
export default defineAction({
  name: 'getIndexingStatus',
  params: assetSchemas.AssetItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get indexing status for one asset',
    description: oneLine`
      Returns the status row for a single asset; empty when the asset
      has never been indexed.
    `,
    responses: {
      200: {
        description: 'Asset status row, or empty when never indexed.',
        schema: dataEnvelope(z.array(schemas.StatusItem)),
      },
      404: { description: 'Asset not found in this repository.' },
    },
  },
  async handler({ req }) {
    return service.getStatus(req.repository!.id, req.asset!.id);
  },
});

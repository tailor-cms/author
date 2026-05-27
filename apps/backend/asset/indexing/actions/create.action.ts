import { oneLine } from 'common-tags';
import { StatusCodes } from 'http-status-codes';

import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../indexing.schema.ts';
import * as service from '../indexing.service.ts';

// POST /repositories/:repositoryId/assets/indexing
// Queues eligible assets (not yet indexed, failed, or stuck) for
// vector-store indexing. Returns immediately with the storeId and the
// queued ids; the actual indexing runs in the background.
export default defineAction({
  body: schemas.IndexInput,
  openapi: {
    authenticated: true,
    summary: 'Queue assets for vector-store indexing',
    description: oneLine`
      Queues eligible assets (not yet indexed, failed, or stuck) and
      returns the store id plus the ids that were actually queued.
      Indexing runs in the background.
    `,
    responses: {
      200: {
        description: 'Indexing queued.',
        schema: dataEnvelope(schemas.IndexResult),
      },
      404: { description: 'No eligible assets matched the selector.' },
    },
  },
  async handler({ body, req }) {
    const data = await service.index(req.repository!, body.assetIds);
    if (!data) {
      return createError(StatusCodes.NOT_FOUND, 'No matching assets found');
    }
    return data;
  },
});

import { oneLine } from 'common-tags';
import { z } from 'zod';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../indexing.schema.ts';
import * as service from '../indexing.service.ts';

// GET /repositories/:repositoryId/assets/indexing/status
export default defineAction({
  name: 'listIndexingStatuses',
  openapi: {
    authenticated: true,
    summary: 'List indexing status for all repository assets',
    description: oneLine`
      Returns indexing status rows for every asset that has been (or
      is being) indexed.
    `,
    responses: {
      200: {
        description: 'Status rows for every previously indexed asset.',
        schema: dataEnvelope(z.array(schemas.StatusItem)),
      },
    },
  },
  async handler({ req }) {
    return service.getStatus(req.repository!.id);
  },
});

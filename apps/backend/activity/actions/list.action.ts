import { z } from 'zod';

import { defineAction } from '#shared/request/action.ts';
import {
  dataEnvelope,
  RepositoryScopedParams,
} from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities
// Scoped to the repository at /:repositoryId. Default order is by
// `position` (applied via the processQuery middleware).
export default defineAction({
  name: 'list',
  params: RepositoryScopedParams,
  query: schemas.ListFilter,
  openapi: {
    authenticated: true,
    summary: 'List activities in the repository',
    description: `Returns the repository's activities in outline order.`,
    responses: {
      200: {
        description: 'Paginated list of activities.',
        schema: dataEnvelope(z.array(schemas.Activity)),
      },
    },
  },
  async handler({ query, req }) {
    return service.list(req.repository!, req.opts!, query);
  },
});

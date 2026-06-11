import { z } from 'zod';
import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../content-element.service.ts';

// GET /repositories/:repositoryId/content-elements
// Two call shapes from the FE store:
//   - `{ activityIds: [activityId, ...] }`  bulk-load every element
//     under a set of parent activities.
//   - no filters return every non-detached element in the repo
export default defineAction({
  name: 'list',
  params: RepositoryScopedParams,
  query: schemas.ListFilter,
  openapi: {
    authenticated: true,
    summary: 'List content elements in the repository',
    description:
      'Returns content elements, optionally narrowed to activity parents',
    responses: {
      200: {
        description: 'List of content elements matching the filter.',
        schema: dataEnvelope(z.array(schemas.ContentElement)),
      },
    },
  },
  async handler({ query, req }) {
    return service.list(req.opts!, query);
  },
});

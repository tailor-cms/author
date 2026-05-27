import { z } from 'zod';

import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

// GET /repositories/:repositoryId/comments
// Scoped listing of repository comments. The client typically narrows
// by either `activityId` (activity-level discussion) or `contentElementId`
// (content element thread); list defaults to `createdAt DESC` and includes
// soft-deleted rows so deleted comments stay visible in the thread.
export default defineAction({
  params: RepositoryScopedParams,
  query: schemas.ListFilter,
  openapi: {
    authenticated: true,
    summary: 'List comments in the repository',
    description: `Returns the repository's comments in newest-first order.`,
    responses: {
      200: {
        description: 'List of comments matching the filter.',
        schema: dataEnvelope(z.array(schemas.Comment)),
      },
    },
  },
  async handler({ query, req }) {
    return service.list(req.repository!, req.opts!, query);
  },
});

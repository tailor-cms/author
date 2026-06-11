import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../comment.service.ts';

// POST /repositories/:repositoryId/comments
// Creates a new comment authored by the current user.
export default defineAction({
  name: 'create',
  params: RepositoryScopedParams,
  body: schemas.CreateInput,
  openapi: {
    authenticated: true,
    summary: 'Create a comment',
    description: 'Creates a comment under the scoped repository.',
    responses: {
      200: {
        description: 'Created comment.',
        schema: dataEnvelope(schemas.Comment),
      },
    },
  },
  async handler({ body, user, req }) {
    return service.create(req.repository!, user, body);
  },
});

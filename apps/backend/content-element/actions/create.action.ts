import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../content-element.service.ts';

// POST /repositories/:repositoryId/content-elements
// Creates a new element under the scoped repository. `repositoryId` is
// taken from the loaded repo on `req`.
export default defineAction({
  name: 'create',
  params: RepositoryScopedParams,
  body: schemas.CreateInput,
  openapi: {
    authenticated: true,
    summary: 'Create a content element',
    description: 'Creates a content element under the scoped repository.',
    responses: {
      200: {
        description: 'Created content element.',
        schema: dataEnvelope(schemas.ContentElement),
      },
    },
  },
  async handler({ body, user, req }) {
    return service.create(req.repository!, user, body);
  },
});

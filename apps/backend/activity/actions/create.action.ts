import { defineAction } from '#shared/request/action.ts';
import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities
// Creates an activity under the scoped repository. `repositoryId` always
// comes from the loaded repo, never from the body. Outline-level
// activities are seeded with the schema's `defaultMeta`.
export default defineAction({
  params: RepositoryScopedParams,
  body: schemas.CreateInput,
  openapi: {
    authenticated: true,
    summary: 'Create an activity',
    description: 'Creates a new activity under the scoped repository.',
    responses: {
      200: {
        description: 'Created activity.',
        schema: dataEnvelope(schemas.Activity),
      },
    },
  },
  async handler({ body, user, req }) {
    return service.create(req.repository!, user, body);
  },
});

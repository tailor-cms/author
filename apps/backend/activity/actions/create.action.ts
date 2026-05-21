import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../activity.schema.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities
// Creates an activity under the scoped repository. `repositoryId` is
// always taken from the loaded repo, never the body. Outline-level
// activities are seeded with the schema's `defaultMeta` so their `data`
// blob lands with the right shape for the FE editor.
export default defineAction({
  body: schemas.CreateInput,
  openapi: {
    summary: 'Create an activity',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.create(req.repository!, user, body);
  },
});

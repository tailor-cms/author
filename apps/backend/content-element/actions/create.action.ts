import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../content-element.schema.ts';
import * as service from '../content-element.service.ts';

// POST /repositories/:repositoryId/content-elements
// Creates a new element under the scoped repository. `repositoryId` is
// taken from the loaded repo on `req`.
export default defineAction({
  body: schemas.CreateInput,
  openapi: {
    summary: 'Create a content element',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.create(req.repository!, user, body);
  },
});

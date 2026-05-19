import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../repository.schema.ts';
import * as service from '../repository.service.ts';

// POST /repositories/:repositoryId/pin
// Toggles the pinned flag on the user's RepositoryUser row.
export default defineAction({
  body: schemas.PinBody,
  openapi: {
    summary: 'Pin / unpin a repository for the current user',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.pin(req.repository!, user, body.pin);
  },
});

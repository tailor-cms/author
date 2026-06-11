import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../repository.service.ts';

// POST /repositories/:repositoryId/pin
export default defineAction({
  name: 'pin',
  params: schemas.RepositoryItemParams,
  body: schemas.PinInput,
  openapi: {
    authenticated: true,
    summary: 'Pin / unpin a repository for the current user',
    responses: {
      200: {
        description: `Updated RepositoryUser row carrying the new pinned flag.`,
        schema: dataEnvelope(schemas.RepositoryUser),
      },
    },
  },
  async handler({ body, user, req }) {
    return service.pin(req.repository!, user, body.pin);
  },
});

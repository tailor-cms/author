import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../repository.service.ts';

// GET /repositories/:repositoryId
// Loads the repository detail view: last revision, the current user's
// RepositoryUser row, attached user groups, and tags.
export default defineAction({
  params: schemas.RepositoryItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get a repository by id',
    responses: {
      200: {
        description: 'Repository detail view.',
        schema: dataEnvelope(schemas.Repository),
      },
    },
  },
  async handler({ user, req }) {
    return service.loadDetail(req.repository!, user);
  },
});

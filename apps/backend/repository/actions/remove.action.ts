import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../repository.service.ts';

// DELETE /repositories/:repositoryId
// Soft-deletes the repository and updates the published catalog.
export default defineAction({
  params: schemas.RepositoryItemParams,
  openapi: {
    authenticated: true,
    summary: 'Soft-delete a repository',
    responses: { 204: { description: 'No content' } },
  },
  async handler({ user, req }) {
    await service.remove(req.repository!, user);
    // Returning undefined → 204 No Content.
  },
});

import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../../repository.schema.ts';
import * as service from '../../repository.service.ts';

// DELETE /repositories/:repositoryId/tags/:tagId
// Detaches a tag from the repository (the Tag row is left in place).
export default defineAction({
  params: schemas.RemoveTagParams,
  openapi: {
    summary: 'Detach a tag from a repository',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  async handler({ params, req }) {
    await service.removeTag(req.repository!.id, params.tagId);
  },
});

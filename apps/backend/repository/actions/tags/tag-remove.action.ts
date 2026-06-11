import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../../schemas/index.ts';
import * as service from '../../repository.service.ts';

// DELETE /repositories/:repositoryId/tags/:tagId
// Detaches a tag from the repository (the Tag row is left in place).
export default defineAction({
  name: 'removeTag',
  params: schemas.TagItemParams,
  openapi: {
    authenticated: true,
    summary: 'Detach a tag from a repository',
    responses: { 204: { description: 'No content' } },
  },
  async handler({ params, req }) {
    await service.removeTag(req.repository!.id, params.tagId);
  },
});

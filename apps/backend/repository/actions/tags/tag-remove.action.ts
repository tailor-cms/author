import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../../repository.service.ts';

// DELETE /repositories/:repositoryId/tags/:tagId
// Detaches a tag from the repository (the Tag row is left in place).
const Params = z.object({
  repositoryId: IntParam(),
  tagId: IntParam(),
});

export default defineAction({
  params: Params,
  openapi: {
    summary: 'Detach a tag from a repository',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  async handler({ params }) {
    await service.removeTag(params.repositoryId, params.tagId);
  },
});

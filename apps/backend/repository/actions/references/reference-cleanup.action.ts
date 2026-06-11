import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../../schemas/index.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/references/cleanup
// Removes dangling activity / element references returned by the paired
// /references/validate endpoint. Body shape mirrors ReferenceValidationResult.
async function handler({
  body,
  req,
}: Ctx<{
  body: typeof schemas.ReferenceCleanupInput;
  params: typeof schemas.RepositoryItemParams;
}>) {
  await service.cleanupReferences(
    req.repository!.id,
    body.activities,
    body.elements,
  );
}

export default defineAction({
  name: 'cleanupReferences',
  params: schemas.RepositoryItemParams,
  body: schemas.ReferenceCleanupInput,
  openapi: {
    authenticated: true,
    summary: 'Remove dangling references from activities and elements',
    responses: { 204: { description: 'No content' } },
  },
  handler,
});

import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../../repository.schema.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/references/cleanup
// Removes dangling activity / element references returned by the paired
// /references/validate endpoint. Body shape mirrors ReferenceValidationResult.
async function handler({
  body,
  req,
}: Ctx<{ body: typeof schemas.ReferenceCleanupInput }>) {
  await service.cleanupReferences(
    req.repository!.id,
    body.activities as any[] | undefined,
    body.elements as any[] | undefined,
  );
}

export default defineAction({
  body: schemas.ReferenceCleanupInput,
  openapi: {
    summary: 'Remove dangling references from activities and elements',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  handler,
});

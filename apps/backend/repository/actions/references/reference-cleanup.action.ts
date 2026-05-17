import { z } from 'zod';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/references/cleanup
// Removes dangling activity / element references returned by the paired
// /references/validate endpoint. Body shape mirrors ReferenceValidationResult.
const Body = z.object({
  // Activities with dangling references to remove.
  activities: z.array(z.record(z.string(), z.unknown())).optional(),
  // Content elements with dangling references to remove.
  elements: z.array(z.record(z.string(), z.unknown())).optional(),
});
export type CleanupBody = z.infer<typeof Body>;

async function handler({ body, req }: Ctx<{ body: typeof Body }>) {
  await service.cleanupReferences(
    req.repository!.id,
    body.activities as any[] | undefined,
    body.elements as any[] | undefined,
  );
}

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Remove dangling references from activities and elements',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  handler,
});

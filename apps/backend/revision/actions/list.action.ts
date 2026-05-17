import { z } from 'zod';
import { Entity } from '@tailor-cms/interfaces/revision';
import { defineAction } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../revision.service.ts';

// GET /repositories/:repositoryId/revisions
// Two call shapes from the client:
//   - bulk list (revisions page) - no filters
//   - per-entity audit trail (EntityRevisions) - `entity` + `entityId`
const Query = z
  .object({
    // Restrict to one entity kind. When set, `entityId` is
    // required so the result is scoped.
    entity: z.enum(Entity).optional(),
    // The entity id; matched against the JSONB `state.id` field.
    entityId: IntParam().optional(),
    // Pagination & sort
    offset: IntParam().optional(),
    limit: IntParam().optional(),
    sortBy: z.string().max(64).optional(),
    sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
  })
  .refine((q) => !q.entity || q.entityId !== undefined, {
    message: '`entityId` is required when `entity` is set',
    path: ['entityId'],
  });
export type ListQuery = z.infer<typeof Query>;

export default defineAction({
  raw: true,
  query: Query,
  openapi: {
    summary: 'List revisions for the repository (optionally scoped to one entity)',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.list(req.repository!, req.opts!, query);
  },
});

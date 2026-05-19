import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { IntParam, QueryBoolean } from '#shared/request/schemas.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities
// Scoped to the repository at /:repositoryId. Default order is by
// `position`.
const Query = z.object({
  // Include detached items (unreachable in the outline). Default: false.
  detached: QueryBoolean.optional(),
  // Restrict to outline-level activities (those declared in the schema's
  // outline structure). Adds the "published-but-not-yet-deleted" carve-out
  // so the FE can show pending-unpublish entries.
  outlineOnly: QueryBoolean.optional(),
  // Pagination + sort (consumed by processQuery middleware).
  offset: IntParam().optional(),
  limit: IntParam().optional(),
  sortBy: z.string().max(64).optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
  paranoid: QueryBoolean.optional(),
});
export type ListQuery = z.infer<typeof Query>;

export default defineAction({
  query: Query,
  openapi: {
    summary: 'List activities in the repository',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.list(req.repository!, req.opts!, query);
  },
});

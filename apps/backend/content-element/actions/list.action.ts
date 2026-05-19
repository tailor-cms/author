import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { IntParam, QueryBoolean } from '#shared/request/schemas.ts';
import * as service from '../content-element.service.ts';

// GET /repositories/:repositoryId/content-elements
// Two call shapes from the FE store:
//   - `{ activityIds: [activityId, ...] }`  bulk-load every element
//     under a set of parent activities.
//   - no filters return every non-detached element in the repo
const Query = z.object({
  // Restrict to elements whose `activityId` is in the provided set. The
  // wire shape arrives either as a real array, a single value, or a
  // comma-separated string depending on the qs-serializer; coerced to ints.
  activityIds: z.preprocess(
    (v) => {
      if (v == null) return undefined;
      if (Array.isArray(v)) return v.length ? v.map((x) => Number(x)) : undefined;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
          return undefined;
        }
        return trimmed.split(',').filter(Boolean).map(Number);
      }
      return v;
    },
    z.array(z.number().int()).optional(),
  ),
  // Include detached elements; unreachable in the outline.
  // Default: false.
  detached: QueryBoolean.optional(),
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
    summary: 'List content elements in the repository',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.list(req.opts!, query);
  },
});

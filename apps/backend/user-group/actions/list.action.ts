import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../user-group.service.ts';

// GET /user-group
// Lists groups visible to the acting user. Non-admins only see groups
// they are a member of; admins see all (optionally filtered by name).
const Query = z.object({
  // Substring match against group name (iLike).
  filter: z.string().trim().max(100).optional(),
  // Pagination + sort (consumed by processQuery middleware).
  offset: IntParam().optional(),
  limit: IntParam().optional(),
  sortBy: z.string().max(64).optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
});
export type ListQuery = z.infer<typeof Query>;

export default defineAction({
  query: Query,
  openapi: {
    summary: 'List user groups visible to the current user',
    authenticated: true,
  },
  async handler({ query, user, req }) {
    return service.list(user, req.opts!, query);
  },
});

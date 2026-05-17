import { z } from 'zod';
import { UserRole } from '@tailor-cms/interfaces/role';
import { defineAction } from '#shared/request/action.ts';
import { IntParam, QueryBoolean } from '#shared/request/schemas.ts';
import * as service from '../user.service.ts';

// GET /users
// Admin-only listing with iLike search + email/role filters;
const Query = z.object({
  // Substring match across email, firstName, lastName
  filter: z.string().trim().max(250).optional(),
  // Exact email match
  // Deliberately NOT validated as a full email address: a
  // search probe with a malformed value should return zero rows
  email: z.string().trim().max(250).optional(),
  // Restrict to a specific user role.
  role: z.enum(UserRole).optional(),
  // Include soft-deleted (archived) users in the result.
  archived: QueryBoolean.optional(),
  // Pagination and sorting
  offset: IntParam().optional(),
  limit: IntParam().optional(),
  sortBy: z.string().max(64).optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
});
export type ListQuery = z.infer<typeof Query>;

export default defineAction({
  query: Query,
  openapi: {
    summary: 'List users (admin)',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.list(req.options!, query);
  },
});

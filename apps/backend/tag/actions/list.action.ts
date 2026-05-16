import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { QueryBoolean } from '#shared/request/schemas.ts';
import * as service from '../tag.service.ts';

// GET /tags
// Returns the tag catalog. The FE filter dropdowns use `associated=true`
// to scope the list to tags reachable through the current user's
// repositories;
const Query = z.object({
  // Restrict to tags attached to repositories the user can access.
  associated: QueryBoolean.optional(),
});
export type ListQuery = z.infer<typeof Query>;

export default defineAction({
  query: Query,
  openapi: {
    summary: 'List tags (optionally scoped to the current user)',
    authenticated: true,
  },
  async handler({ query, user }) {
    return service.list(user, query);
  },
});

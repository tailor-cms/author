import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import {
  IntParam,
  QueryBoolean,
  StringArrayFromQuery,
} from '#shared/request/schemas.ts';
import * as service from '../repository.service.ts';

// GET /repositories
// Visibility-filtered list with last-revision annotation. The pagination
// + sort fields below are consumed by the `processQuery` middleware
// mounted alongside (it reads them off req.query to build req.opts).
const Query = z.object({
  // Substring match against repository name (iLike, up to 250 chars).
  search: z.string().trim().max(250).optional(),
  // Exact match against repository name.
  name: z.string().trim().max(250).optional(),
  // Restrict to repositories shared with a single user group.
  userGroupId: IntParam().optional(),
  // Pinned filter for the current user's catalog view.
  pinned: QueryBoolean.optional(),
  // Restrict to one or more schema ids
  // (overrides the default general.availableSchemas list).
  schemas: StringArrayFromQuery(),
  // Restrict to repositories tagged with any of these tag ids.
  tagIds: StringArrayFromQuery(),
  // Schema id used to find repos whose schema is link-compatible via the
  // mapsTo cross-schema rules (defined in the schema).
  compatibleWith: z.string().trim().max(64).optional(),
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
  // The list response carries top-level metadata (`total`, `items`); pass
  // it through verbatim rather than wrapping in `{ data }`.
  raw: true,
  openapi: {
    summary: 'List repositories visible to the current user',
    authenticated: true,
  },
  async handler({ query, user, req }) {
    return service.list(req.opts!, user, query);
  },
});

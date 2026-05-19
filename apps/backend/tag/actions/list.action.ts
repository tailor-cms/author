import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../tag.schema.ts';
import * as service from '../tag.service.ts';

// GET /tags
// Returns the tag catalog. The FE filter dropdowns use `associated=true`
// to scope the list to tags reachable through the current user's
// repositories;
export default defineAction({
  query: schemas.ListQuery,
  openapi: {
    summary: 'List tags (optionally scoped to the current user)',
    authenticated: true,
  },
  async handler({ query, user }) {
    return service.list(user, query);
  },
});

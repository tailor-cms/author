import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../user-group.schema.ts';
import * as service from '../user-group.service.ts';

// GET /user-group
// Lists groups visible to the acting user. Non-admins only see groups
// they are a member of; admins see all (optionally filtered by name).
export default defineAction({
  query: schemas.ListQuery,
  openapi: {
    summary: 'List user groups visible to the current user',
    authenticated: true,
  },
  async handler({ query, user, req }) {
    return service.list(user, req.opts!, query);
  },
});

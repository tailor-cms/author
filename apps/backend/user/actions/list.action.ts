import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../user.schema.ts';
import * as service from '../user.service.ts';

// GET /users
// Admin-only listing with iLike search + email/role filters;
export default defineAction({
  query: schemas.ListQuery,
  openapi: {
    summary: 'List users (admin)',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.list(req.options!, query);
  },
});

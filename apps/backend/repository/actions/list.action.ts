import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../repository.schema.ts';
import * as service from '../repository.service.ts';

// GET /repositories
// Visibility-filtered list with last-revision annotation. The pagination
// + sort fields below are consumed by the `processQuery` middleware
// mounted alongside (it reads them off req.query to build req.opts).
export default defineAction({
  query: schemas.ListQuery,
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

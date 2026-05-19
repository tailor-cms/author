import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../revision.schema.ts';
import * as service from '../revision.service.ts';

// GET /repositories/:repositoryId/revisions
// Two call shapes from the client:
//   - bulk list (revisions page) - no filters
//   - per-entity audit trail (EntityRevisions) - `entity` + `entityId`
export default defineAction({
  raw: true,
  query: schemas.ListQuery,
  openapi: {
    summary: 'List revisions for the repository (optionally scoped to one entity)',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.list(req.repository!, req.opts!, query);
  },
});

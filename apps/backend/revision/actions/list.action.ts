import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../revision.schema.ts';
import * as service from '../revision.service.ts';

// GET /repositories/:repositoryId/revisions
// Two call shapes from the client:
//   - bulk list (revisions page) - no filters
//   - per-entity audit trail (EntityRevisions) - `entity` + `entityId`
export default defineAction({
  raw: true,
  params: schemas.ListParams,
  query: schemas.ListFilter,
  openapi: {
    summary: 'List revisions',
    description: oneLine`
      Returns a page of revisions for the repository, optionally
      narrowed to a single entity's audit trail.
    `,
    authenticated: true,
    responses: {
      200: {
        description: 'Page of revisions for the repository.',
        schema: schemas.ListResult,
      },
    },
  },
  async handler({ query, req }) {
    return service.list(req.repository!, req.opts!, query);
  },
});

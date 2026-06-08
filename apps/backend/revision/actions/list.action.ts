import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import { RepositoryScopedParams } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../revision.service.ts';

// GET /repositories/:repositoryId/revisions
// Two call shapes from the client:
//   - bulk list (revisions page) - no filters
//   - per-entity audit trail (EntityRevisions) - `entity` + `entityId`
export default defineAction({
  raw: true,
  params: RepositoryScopedParams,
  query: schemas.ListFilter,
  openapi: {
    authenticated: true,
    summary: 'List revisions',
    description: oneLine`
      Returns a page of revisions for the repository, optionally
      narrowed to a single entity's audit trail.
    `,
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

import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../activity.schema.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities
// Scoped to the repository at /:repositoryId. Default order is by
// `position`.
export default defineAction({
  query: schemas.ListQuery,
  openapi: {
    summary: 'List activities in the repository',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.list(req.repository!, req.opts!, query);
  },
});

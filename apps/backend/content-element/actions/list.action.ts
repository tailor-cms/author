import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../content-element.schema.ts';
import * as service from '../content-element.service.ts';

// GET /repositories/:repositoryId/content-elements
// Two call shapes from the FE store:
//   - `{ activityIds: [activityId, ...] }`  bulk-load every element
//     under a set of parent activities.
//   - no filters return every non-detached element in the repo
export default defineAction({
  query: schemas.ListQuery,
  openapi: {
    summary: 'List content elements in the repository',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.list(req.opts!, query);
  },
});

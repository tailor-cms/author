import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../comment.schema.ts';
import * as service from '../comment.service.ts';

// GET /repositories/:repositoryId/comments
// Scoped listing of repository comments. The client always narrows by either
// `activityId` (activity-level discussion) or `contentElementId` (inline
// discussion);
export default defineAction({
  query: schemas.ListFilter,
  openapi: {
    summary: 'List comments on the repository',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.list(req.repository!, req.opts!, query);
  },
});

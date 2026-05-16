import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../comment.service.ts';

// GET /repositories/:repositoryId/comments
// Scoped listing of repository comments. The client always narrows by either
// `activityId` (activity-level discussion) or `contentElementId` (inline
// discussion);
const Query = z.object({
  // Restrict to comments on a single activity.
  activityId: IntParam().optional(),
  // Restrict to comments on a single content element. Both filters may
  // be combined; the client never sends both, but the wire shape supports it.
  contentElementId: IntParam().optional(),
});
export type ListQuery = z.infer<typeof Query>;

export default defineAction({
  query: Query,
  openapi: {
    summary: 'List comments on the repository',
    authenticated: true,
  },
  async handler({ query, req }) {
    return service.list(req.repository!, req.opts!, query);
  },
});

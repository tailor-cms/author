import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../comment.service.ts';

// POST /repositories/:repositoryId/comments
// Creates a new comment authored by the current user.
const Body = z.object({
  // Client-generated uid. Optional - the
  // model defaults to UUIDv4 when absent.
  uid: z.uuid().optional(),
  // Activity this comment belongs to; required for element-scoped
  // comments so the activity-thread view sees them.
  activityId: IntParam(),
  // Optional element scope; absent for activity-level discussion.
  contentElementId: IntParam().optional(),
  // Comment body. Length floor mirrors the model's `len: [1, 2000]`
  // validator so we reject obvious garbage at the wire boundary.
  content: z.string().min(1).max(2000),
});
export type CreateBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Create a comment',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.create(req.repository!, user, body);
  },
});

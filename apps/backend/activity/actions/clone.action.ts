import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/clone
// Deep-clones the activity (with descendants + elements) into the
// target (repository, parent, position). `hasCloneTargetAccess`
// middleware verifies the caller can write into the target before this
// fires.
const Body = z.object({
  // Target repository for the clone. Verified for access by middleware.
  repositoryId: z.number().int().positive(),
  // Target parent activity (`null` clones to the outline root).
  parentId: z.number().int().positive().nullable().optional(),
  // Target position. When omitted, the model leaves the source position.
  position: z.number().min(0).optional(),
});
export type CloneBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Deep-clone an activity into a target location',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.clone(user, req.activity!, body);
  },
});

import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// PATCH /repositories/:repositoryId/activities/:activityId
// Updates mutable fields.
const Body = z.object({
  // New position among siblings (use /reorder for index-based moves).
  position: z.number().min(0).optional(),
  // Replacement data bag (JSONB); shape is owned by the schema's
  // outline-level config. Editing `data` on a linked copy auto-unlinks
  // via the model's `autoUnlinkOnEdit` afterUpdate hook.
  data: z.record(z.string(), z.unknown()).optional(),
  // Replacement refs bag.
  refs: z.record(z.string(), z.unknown()).optional(),
  // New parent activity. `null` re-roots the activity. Reparenting an
  // outline activity bumps the old parent's `modifiedAt`.
  parentId: z.number().int().positive().nullable().optional(),
});
export type PatchBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Patch an activity',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.update(req.repository!, user, req.activity!, body);
  },
});

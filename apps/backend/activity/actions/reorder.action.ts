import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/reorder
// Recalculates the activity's `position` from the target index among
// schema-defined sibling types.
const Body = z.object({
  // Zero-based target index in the sibling list. Float, because the
  // client may pass a normalized fractional position (the model recomputes
  // anyway via `calculatePosition`).
  position: z.number().min(0),
});
export type ReorderBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Reorder an activity',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.reorder(req.repository!, user, req.activity!, body.position);
  },
});

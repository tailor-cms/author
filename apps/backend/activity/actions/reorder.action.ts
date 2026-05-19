import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../activity.schema.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/reorder
// Recalculates the activity's `position` from the target index among
// schema-defined sibling types.
export default defineAction({
  body: schemas.ReorderBody,
  openapi: {
    summary: 'Reorder an activity',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.reorder(req.repository!, user, req.activity!, body.position);
  },
});

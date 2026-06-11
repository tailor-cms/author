import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/reorder
// Recalculates the activity's `position` from the target index among
// schema-defined sibling types.
export default defineAction({
  name: 'reorder',
  params: schemas.ActivityItemParams,
  body: schemas.ReorderInput,
  openapi: {
    authenticated: true,
    summary: 'Reorder an activity',
    description: 'Recalculates position from a sibling-index target.',
    responses: {
      200: {
        description: 'Activity row at its new position.',
        schema: dataEnvelope(schemas.Activity),
      },
      403: { description: 'Activity belongs to a different repository.' },
      404: { description: 'Activity not found.' },
    },
  },
  async handler({ body, user, req }) {
    return service.reorder(req.repository!, user, req.activity!, body.position);
  },
});

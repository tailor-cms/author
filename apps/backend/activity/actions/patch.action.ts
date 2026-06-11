import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// PATCH /repositories/:repositoryId/activities/:activityId
// Updates mutable fields. Editing `data` on a linked copy auto-unlinks
// via the model's `autoUnlinkOnEdit` afterUpdate hook.
export default defineAction({
  name: 'update',
  params: schemas.ActivityItemParams,
  body: schemas.PatchInput,
  openapi: {
    authenticated: true,
    summary: 'Patch an activity',
    description: 'Updates mutable fields on the activity.',
    responses: {
      200: {
        description: 'Updated activity row.',
        schema: dataEnvelope(schemas.Activity),
      },
      403: { description: 'Activity belongs to a different repository.' },
      404: { description: 'Activity not found.' },
    },
  },
  async handler({ body, user, req }) {
    return service.update(req.repository!, user, req.activity!, body);
  },
});

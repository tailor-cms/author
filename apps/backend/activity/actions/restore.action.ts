import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// PATCH /repositories/:repositoryId/activities/:activityId/restore
// Restores a soft-deleted activity and its descendants (activities +
// elements).
export default defineAction({
  name: 'restore',
  params: schemas.ActivityItemParams,
  openapi: {
    authenticated: true,
    summary: 'Restore an activity from soft-delete (recursive)',
    description: 'Removes soft-delete flag for activity and its descendants.',
    responses: {
      200: {
        description: 'Restored activity row.',
        schema: dataEnvelope(schemas.Activity),
      },
      403: { description: 'Activity belongs to a different repository.' },
      404: { description: 'Activity not found.' },
    },
  },
  async handler({ user, req }) {
    return service.restore(req.repository!, user, req.activity!);
  },
});

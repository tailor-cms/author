import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/unlink
// Converts a linked activity tree into an independent local copy.
// `sourceId` is preserved for provenance; descendants (activities +
// elements) are unlinked transitively by the link service.
export default defineAction({
  name: 'unlink',
  params: schemas.ActivityItemParams,
  openapi: {
    authenticated: true,
    summary: 'Unlink an activity from its source',
    description: 'Detaches the linked tree so it becomes an independent copy.',
    responses: {
      200: {
        description: 'Unlinked activity row.',
        schema: dataEnvelope(schemas.Activity),
      },
      403: { description: 'Activity belongs to a different repository.' },
      404: { description: 'Activity not found.' },
    },
  },
  async handler({ user, req }) {
    return service.unlink(req.repository!, user, req.activity!);
  },
});

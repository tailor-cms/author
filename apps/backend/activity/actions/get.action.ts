import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities/:activityId
// The `getActivity` param middleware loads the row, enforces repository
// scoping, and returns 404 / 403 otherwise.
export default defineAction({
  params: schemas.ActivityItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get a single activity by id',
    description: 'Returns the activity row.',
    responses: {
      200: {
        description: 'The activity row.',
        schema: dataEnvelope(schemas.Activity),
      },
      403: { description: 'Activity belongs to a different repository.' },
      404: { description: 'Activity not found.' },
    },
  },
  async handler({ req }) {
    return service.loadDetail(req.activity!);
  },
});

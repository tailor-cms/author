import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities/:activityId/source
// Returns `{ id, repository }` for the source activity of a linked
// copy, or `null` when the activity is not a copy / the source has
// been hard-deleted.
export default defineAction({
  params: schemas.ActivityItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get source info for a linked activity copy',
    description: 'Returns the source activity pointer for a linked copy.',
    responses: {
      200: {
        description: 'Source info, or null when not a linked copy.',
        schema: dataEnvelope(schemas.ActivitySourceInfo.nullable()),
      },
      403: { description: 'Activity belongs to a different repository.' },
      404: { description: 'Activity not found.' },
    },
  },
  async handler({ req }) {
    return service.getSource(req.activity!);
  },
});

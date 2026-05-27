import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities/:activityId/copies
// Returns active linked copies of this source activity across
// repositories, filtered to entry-point copies (not nested under
// another linked copy).
export default defineAction({
  params: schemas.ActivityItemParams,
  openapi: {
    authenticated: true,
    summary: 'List active linked copies of a source activity',
    description: 'Returns linked copies of this activity across repositories.',
    responses: {
      200: {
        description: 'List of entry-point linked copies.',
        schema: dataEnvelope(schemas.CopiesResult),
      },
      403: { description: 'Activity belongs to a different repository.' },
      404: { description: 'Activity not found.' },
    },
  },
  async handler({ req }) {
    const copies = await service.getCopies(req.activity!);
    return { copies };
  },
});

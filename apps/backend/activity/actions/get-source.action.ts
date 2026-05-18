import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities/:activityId/source
// Returns `{ id, repository }` for the source activity of a linked copy,
// or `null` when the activity is not a copy / the source has been hard-
// deleted.
export default defineAction({
  openapi: {
    summary: 'Get source info for a linked activity copy',
    authenticated: true,
  },
  async handler({ req }) {
    return service.getSource(req.activity!);
  },
});

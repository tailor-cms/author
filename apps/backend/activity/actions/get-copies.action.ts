import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities/:activityId/copies
// Returns active linked copies of this source activity across
// repositories, filtered to entry-point copies (not nested under another
// linked copy).
export default defineAction({
  openapi: {
    summary: 'List active linked copies of a source activity',
    authenticated: true,
  },
  async handler({ req }) {
    const copies = await service.getCopies(req.activity!);
    return { copies };
  },
});

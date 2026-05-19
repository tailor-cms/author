import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities/:activityId
// The `getActivity` param middleware loads the row, enforces repository
// scoping, and returns 404/403 otherwise.
export default defineAction({
  openapi: {
    summary: 'Get a single activity by id',
    authenticated: true,
  },
  async handler({ req }) {
    return service.loadDetail(req.activity!);
  },
});

import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// PATCH /repositories/:repositoryId/activities/:activityId/restore
// Restores a soft-deleted activity and its descendants (activities +
// elements).
export default defineAction({
  openapi: {
    summary: 'Restore an activity from soft-delete (recursive)',
    authenticated: true,
  },
  async handler({ user, req }) {
    return service.restore(req.repository!, user, req.activity!);
  },
});

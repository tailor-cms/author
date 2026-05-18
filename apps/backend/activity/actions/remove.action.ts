import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// DELETE /repositories/:repositoryId/activities/:activityId
// Soft-deletes the activity (paranoid `deletedAt` set) and marks every
// descendant (activities + content elements) as `detached: true` so
// they're unreachable in the outline while remaining in the DB. For
// outline activities, recomputes the repository's
// `hasUnpublishedChanges` so the publish bar reflects the deletion.
export default defineAction({
  openapi: {
    summary: 'Soft-delete an activity; detach descendants',
    authenticated: true,
  },
  async handler({ user, req }) {
    return service.remove(req.repository!, user, req.activity!);
  },
});

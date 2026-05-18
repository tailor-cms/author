import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/unlink
// Converts a linked activity tree into an independent local copy.
// `sourceId` is preserved for provenance; descendants (activities +
// elements) are unlinked transitively by the link service.
export default defineAction({
  openapi: {
    summary: 'Unlink an activity from its source',
    authenticated: true,
  },
  async handler({ user, req }) {
    return service.unlink(req.repository!, user, req.activity!);
  },
});

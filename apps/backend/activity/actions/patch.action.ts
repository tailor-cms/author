import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../activity.schema.ts';
import * as service from '../activity.service.ts';

// PATCH /repositories/:repositoryId/activities/:activityId
// Updates mutable fields.
export default defineAction({
  body: schemas.PatchInput,
  openapi: {
    summary: 'Patch an activity',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.update(req.repository!, user, req.activity!, body);
  },
});

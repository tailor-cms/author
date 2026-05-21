import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../activity.schema.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/clone
// Deep-clones the activity (with descendants + elements) into the
// target (repository, parent, position). `hasCloneTargetAccess`
// middleware verifies the caller can write into the target before this
// fires.
export default defineAction({
  body: schemas.CloneInput,
  openapi: {
    summary: 'Deep-clone an activity into a target location',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.clone(user, req.activity!, body);
  },
});

import { z } from 'zod';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/clone
// Deep-clones the activity (with descendants + elements) into the
// target (repository, parent, position). The `hasCloneTargetAccess`
// middleware verifies the caller can write into the target before this
// fires.
export default defineAction({
  name: 'clone',
  params: schemas.ActivityItemParams,
  body: schemas.CloneInput,
  openapi: {
    authenticated: true,
    summary: 'Deep-clone an activity into a target location',
    description: 'Copies the activity with descendants into the target.',
    responses: {
      200: {
        description: 'Cloned activity rows.',
        schema: dataEnvelope(z.array(schemas.Activity)),
      },
      400: { description: 'Invalid target parent or repository.' },
      403: { description: 'No access to target repository.' },
    },
  },
  async handler({ body, user, req }) {
    return service.clone(user, req.activity!, body);
  },
});

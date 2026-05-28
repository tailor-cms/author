import { oneLine } from 'common-tags';
import { StatusCodes } from 'http-status-codes';

import { createError } from '#shared/error/helpers.js';
import { defineAction } from '#shared/request/action.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities/:activityId/publish
// Publishes the activity (or unpublishes it if soft-deleted).
// Detached activities cannot be published.
export default defineAction({
  params: schemas.ActivityItemParams,
  openapi: {
    authenticated: true,
    summary: 'Publish an activity (or unpublish it when soft-deleted)',
    description: oneLine`
      Publishes the activity through the publishing service;
      unpublishes when soft-deleted.
    `,
    responses: {
      200: { description: 'Publish job acknowledged.' },
      405: { description: 'Cannot publish a detached activity.' },
    },
  },
  async handler({ req }) {
    const activity = req.activity!;
    if (activity.detached) {
      return createError(
        StatusCodes.METHOD_NOT_ALLOWED,
        'Cannot publish a deleted activity',
      );
    }
    return service.publish(activity);
  },
});

import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// GET /repositories/:repositoryId/activities/:activityId/publish
// Publishes the activity (or unpublishes if soft-deleted). Detached
// activities cannot be (re)published
async function handler({ req }: Ctx) {
  const activity = req.activity!;
  if (activity.detached) {
    return createError(
      StatusCodes.METHOD_NOT_ALLOWED,
      'Cannot publish a deleted activity',
    );
  }
  return service.publish(activity);
}

export default defineAction({
  openapi: {
    summary: 'Publish an activity (or unpublish it when soft-deleted)',
    authenticated: true,
    responses: {
      200: { description: 'OK' },
      405: { description: 'Cannot publish a detached activity' },
    },
  },
  handler,
});

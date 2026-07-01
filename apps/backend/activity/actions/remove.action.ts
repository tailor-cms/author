import { createError } from '#shared/error/helpers.js';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { StatusCodes } from 'http-status-codes';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// DELETE /repositories/:repositoryId/activities/:activityId
// Soft-deletes the activity (paranoid `deletedAt` set) and marks every
// descendant (activities + content elements) as `detached: true` so
// they fall out of the outline while remaining in the DB. For outline
// activities, recomputes the repository's `hasUnpublishedChanges`.
export default defineAction({
  name: 'delete',
  params: schemas.ActivityItemParams,
  openapi: {
    authenticated: true,
    summary: 'Soft-delete an activity; detach descendants',
    description: 'Soft-deletes the activity and detaches its descendants.',
    responses: {
      200: {
        description: 'ID of the soft-deleted activity.',
        schema: dataEnvelope(schemas.RemoveResult),
      },
      403: { description: 'Activity belongs to a different repository.' },
      404: { description: 'Activity not found.' },
      409: { description: 'Referenced by a RESTRICT relationship.' },
    },
  },
  async handler({ user, req }) {
    try {
      // await so a rejection is caught
      return await service.remove(req.repository!, user, req.activity!);
    } catch (err) {
      if (err instanceof service.RestrictedDeletionError) {
        return createError(StatusCodes.CONFLICT, err.message);
      }
      throw err;
    }
  },
});

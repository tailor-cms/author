import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../revision.service.ts';

// POST /repositories/:repositoryId/revisions/restore
// Resets the target activity to the latest non-REMOVE state recorded at
// or before `timestamp`. Each cascade step emits a fresh revision
// (additive restore semantics).
export default defineAction({
  name: 'restore',
  params: RepositoryScopedParams,
  body: schemas.RestoreInput,
  openapi: {
    summary: 'Restore an activity to a moment',
    description: oneLine`
      Resets the target activity (and its directly-attached content
      elements) to the latest non-REMOVE state at or before
      \`timestamp\`. Subsequent edits since that moment are soft-deleted;
      elements that existed then but are soft-deleted now are restored.
    `,
    authenticated: true,
    responses: {
      200: {
        description: 'Cascade summary.',
        schema: dataEnvelope(schemas.RestoreResult),
      },
      404: { description: 'Activity not found in this repository.' },
    },
  },
  async handler({ body, req }) {
    return service.restoreToMoment(
      req.repository!,
      req.user!,
      req.activity!,
      body.timestamp,
    );
  },
});

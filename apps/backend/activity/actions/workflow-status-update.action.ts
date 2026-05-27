import { oneLine } from 'common-tags';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/status
// Creates a new workflow-status entry for the activity. Status history
// is append-only
export default defineAction({
  params: schemas.ActivityItemParams,
  body: schemas.WorkflowStatusInput,
  openapi: {
    authenticated: true,
    summary: `Update an activity's workflow status`,
    description: oneLine`
      Appends a workflow-status row;
      SSE and assignee email run as side effects.
    `,
    responses: {
      200: {
        description: 'The newly-created status row.',
        schema: dataEnvelope(schemas.ActivityStatus),
      },
      403: { description: 'Activity belongs to a different repository.' },
      404: { description: 'Activity not found.' },
    },
  },
  async handler({ body, user, req }) {
    return service.updateWorkflowStatus(user, req.activity!, body);
  },
});

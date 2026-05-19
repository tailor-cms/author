import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../activity.schema.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/status
// Creates a new workflow status entry for the activity. Status history is
// append-only; the model's `defaultScope` returns the latest by
// `createdAt DESC`. The status hooks broadcast SSE and mail the assignee
// when they're not the actor.
export default defineAction({
  body: schemas.WorkflowStatusBody,
  openapi: {
    summary: 'Update an activity\'s workflow status',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.updateWorkflowStatus(user, req.activity!, body);
  },
});

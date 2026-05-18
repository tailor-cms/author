import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import * as service from '../activity.service.ts';

// POST /repositories/:repositoryId/activities/:activityId/status
// Creates a new workflow status entry for the activity. Status history is
// append-only; the model's `defaultScope` returns the latest by
// `createdAt DESC`. The status hooks broadcast SSE and mail the assignee
// when they're not the actor.
const Body = z.object({
  // Assignee user id (`null` clears assignment).
  assigneeId: z.number().int().positive().nullable().optional(),
  // Workflow status id (schema-defined).
  status: z.string().trim().min(1).optional(),
  // Workflow priority id (schema-defined).
  priority: z.string().trim().min(1).optional(),
  // Free-text note attached to the status entry.
  description: z.string().nullable().optional(),
  // Due-date ISO8601 string. `null` clears.
  dueDate: z.union([z.iso.datetime({ offset: true }), z.null()]).optional(),
});
export type WorkflowStatusBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Update an activity\'s workflow status',
    authenticated: true,
  },
  async handler({ body, user, req }) {
    return service.updateWorkflowStatus(user, req.activity!, body);
  },
});

// Wire shape for the activity workflow-status update endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { ShortText } from '#shared/request/schemas.ts';

import { ActivityStatus } from './entity.ts';

export const WorkflowStatusInput = z
  .object({
    assigneeId: ActivityStatus.shape.assigneeId.optional().describe(oneLine`
      Assignee user id; null clears the current assignment.
    `),
    status: ShortText(1, 64)
      .optional()
      .describe('Workflow status id (schema-defined).'),
    priority: ShortText(1, 64)
      .optional()
      .describe('Workflow priority id (schema-defined).'),
    position: ActivityStatus.shape.position.optional(),
    description: ActivityStatus.shape.description.optional(),
    dueDate: ActivityStatus.shape.dueDate
      .optional()
      .describe('ISO-8601 due date; null clears the existing date.'),
  })
  .describe('Workflow status entry payload (append-only).');

export type WorkflowStatusInput = z.infer<typeof WorkflowStatusInput>;

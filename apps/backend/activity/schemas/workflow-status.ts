// Wire shape for the activity workflow-status update endpoint.
import { oneLine } from 'common-tags';
import { z } from 'zod';

import { Int, ShortText } from '#shared/request/schemas.ts';

export const WorkflowStatusInput = z
  .object({
    assigneeId: Int().nullable().optional().describe(oneLine`
      Assignee user id; null clears the current assignment.
    `),
    status: ShortText(1, 64)
      .optional()
      .describe('Workflow status id (schema-defined).'),
    priority: ShortText(1, 64)
      .optional()
      .describe('Workflow priority id (schema-defined).'),
    description: z
      .string()
      .nullable()
      .optional()
      .describe('Free-text note attached to the status entry.'),
    dueDate: z
      .union([z.iso.datetime({ offset: true }), z.null()])
      .optional()
      .describe('ISO-8601 due date; null clears the existing date.'),
  })
  .describe('Workflow status entry payload (append-only).');

export type WorkflowStatusInput = z.infer<typeof WorkflowStatusInput>;

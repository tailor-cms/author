import { stripIndent } from 'common-tags';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  dbContext,
  findActivity,
  recordOperation,
  toolError,
} from '../helpers/index.ts';

const TOOL = 'delete_activity';

interface Input {
  id: number;
}

const description = stripIndent`
  Soft-delete any activity and all its descendants. Works
  for outline activities, containers, and subcontainers.
  Records are preserved for publishing diff tracking.
  Prefer update_activity for renames or fixes - delete
  only when the activity should be removed entirely.`;

const parameters = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'Activity id to delete.',
    },
  },
  required: ['id'],
  additionalProperties: false,
};

/**
 * Soft-delete an activity and recursively remove all
 * descendants (children, containers, elements) in a
 * single transaction.
 */
async function execute(input: Input, ctx: ToolContext) {
  const activity = await findActivity(input.id, ctx);
  if (!activity) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Activity #${input.id} not found.`,
    });
  }
  try {
    // Soft-delete: sets deletedAt on root, detached on
    // descendants. Revisions and records preserved.
    // Activity.restoreWithDescendants() reverses this.
    await activity.remove({
      recursive: true,
      soft: true,
      context: dbContext(ctx),
    });
  } catch (error: any) {
    return toolError({
      tool: TOOL,
      reason: 'failed',
      message: error.message,
    });
  }

  const result = {
    ok: true,
    id: activity.id,
    _invalidates: [
      'outline',
      `activity:${activity.id}`,
      ...(activity.parentId ? [`activity:${activity.parentId}`] : []),
    ],
  };
  recordOperation(TOOL, input, result, ctx, {
    tool: 'restore_activity',
    input: { id: activity.id },
  });
  return result;
}

export const delete_activity: ToolDef = {
  name: TOOL,
  scope: 'destructive',
  description,
  parameters,
  execute,
};

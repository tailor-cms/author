import { stripIndent } from 'common-tags';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  dbContext,
  recordOperation,
  toolError,
} from '../helpers/index.ts';
import db from '#shared/database/index.js';

const { Activity } = db as any;

const TOOL = 'restore_activity';

interface Input {
  id: number;
}

const description = stripIndent`
  Restore a soft-deleted activity and all its descendants.
  Reverses delete_activity - flips flags back, preserving
  the original ids, data, and revision history.
`;

const parameters = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'Activity id to restore.',
    },
  },
  required: ['id'],
  additionalProperties: false,
};

/**
 * Restore a soft-deleted activity and its descendants.
 * Calls the model's restoreWithDescendants which clears
 * deletedAt on the root and detached flags on all
 * descendants in a single transaction.
 */
async function execute(input: Input, ctx: ToolContext) {
  const activity = await Activity.findByPk(input.id, {
    paranoid: false,
  });
  if (
    !activity ||
    activity.repositoryId !== ctx.repository.id
  ) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Activity #${input.id} not found.`,
    });
  }
  if (!activity.deletedAt) {
    return toolError({
      tool: TOOL,
      reason: 'not_deleted',
      message: `Activity #${input.id} is not deleted.`,
    });
  }

  try {
    await activity.restoreWithDescendants({
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
    tool: 'delete_activity',
    input: { id: activity.id },
  });
  return result;
}

export const restore_activity: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};

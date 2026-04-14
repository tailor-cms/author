import { oneLine, stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  dbContext,
  findActivity,
  nextPosition,
  recordOperation,
  summarizeActivity,
  toolError,
} from '../helpers/index.ts';

const api = schemaAPI as any;

const TOOL = 'move_activity';

interface Input {
  id: number;
  newParentId?: number | null;
  position?: number | null;
}

const description = stripIndent`
  Move an activity to a new parent and/or position. Validates
  that the target parent's schema allows this activity type
  as a child. Use for restructuring the outline without
  delete/recreate - preserves the activity's content,
  descendants, and revision history. Call get_outline first
  to see current ids and hierarchy.
`;

const parameters = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'Activity id to move.',
    },
    newParentId: {
      type: ['integer', 'null'],
      description: oneLine`
        Target parent activity id, or null to move to
        root level. Omit to keep current parent (reposition
        only). The parent must allow this activity type
        as a child per the schema.
      `,
    },
    position: {
      type: ['integer', 'null'],
      description: oneLine`
        1-based position among siblings at the target
        level. Omit to append at the end.
      `,
    },
  },
  required: ['id'],
  additionalProperties: false,
};

/**
 * Validate that the move target accepts this activity
 * type. Checks rootLevel for null parent, subLevels
 * for a specific parent.
 */
function validateMove(
  activity: any,
  newParent: any | null,
): string | null {
  if (!newParent) {
    const config = api.getLevel(activity.type);
    if (config && !config.rootLevel) {
      return `"${activity.type}" cannot be at root level.`;
    }
    return null;
  }
  const parentConfig = api.getLevel(newParent.type);
  const allowed = parentConfig?.subLevels || [];
  if (allowed.length && !allowed.includes(activity.type)) {
    return oneLine`
      "${activity.type}" is not allowed under
      "${newParent.type}". Allowed: ${allowed.join(', ')}.
    `;
  }
  return null;
}

/**
 * Move an activity to a new parent and/or position.
 * Captures previous location for undo support.
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
  const previousParentId = activity.parentId;
  const previousPosition = activity.position;
  // Omitted newParentId = reposition within current parent
  const hasNewParent = 'newParentId' in input;
  const targetParentId = hasNewParent
    ? (input.newParentId ?? null)
    : activity.parentId;

  if (hasNewParent) {
    const newParent = input.newParentId != null
      ? await findActivity(input.newParentId, ctx)
      : null;
    if (input.newParentId != null && !newParent) {
      return toolError({
        tool: TOOL,
        reason: 'parent_not_found',
        message: `Parent #${input.newParentId} not found.`,
        hint: 'Call get_outline for current ids.',
      });
    }
    const moveError = validateMove(activity, newParent);
    if (moveError) {
      return toolError({
        tool: TOOL,
        reason: 'invalid_move',
        message: moveError,
      });
    }
  }
  const position = typeof input.position === 'number'
    ? input.position
    : await nextPosition(ctx.repository.id, targetParentId);

  try {
    await activity.update(
      { parentId: targetParentId, position },
      { context: dbContext(ctx) },
    );
  } catch (error: any) {
    return toolError({
      tool: TOOL,
      reason: 'failed',
      message: error.message,
    });
  }
  const summary = summarizeActivity(activity);
  recordOperation(TOOL, input, summary, ctx, {
    tool: TOOL,
    input: {
      id: input.id,
      newParentId: previousParentId,
      position: previousPosition,
    },
  });
  return {
    ok: true,
    ...summary,
    _invalidates: [
      'outline',
      ...(previousParentId ? [`activity:${previousParentId}`] : []),
      ...(targetParentId ? [`activity:${targetParentId}`] : []),
    ],
  };
}

export const move_activity: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};

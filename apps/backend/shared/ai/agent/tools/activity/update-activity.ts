import { oneLine, stripIndent } from 'common-tags';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  dbContext,
  findActivity,
  recordOperation,
  summarizeActivity,
  toolError,
} from '../helpers/index.ts';

const TOOL = 'update_activity';

interface Input {
  id: number;
  data: Record<string, any>;
}

const description = stripIndent`
  Update an activity's data fields. Shallow-merges the
  provided data into the existing activity.data, preserving
  any fields not included. Works for any activity type -
  outline, container, or subcontainer. Call get_schema_info
  to see which meta properties each type supports. For
  attaching assets to FILE fields, use attach_asset_to_activity.
`;

const parameters = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'Activity id to update.',
    },
    data: {
      type: 'object',
      description: oneLine`
        Fields to shallow-merge into activity.data. Accepted
        keys depend on the activity type - call get_schema_info
        to see the schema-defined meta properties.
      `,
      additionalProperties: true,
    },
  },
  required: ['id', 'data'],
  additionalProperties: false,
};

/**
 * Patch an activity's data object. Shallow-merges the
 * input into existing data, preserving fields the caller
 * did not include. Captures previous state for undo.
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

  const previousData = { ...activity.data };
  const mergedData = { ...activity.data, ...input.data };

  try {
    await activity.update(
      { data: mergedData },
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
    input: { id: input.id, data: previousData },
  });
  return {
    ok: true,
    ...summary,
    _invalidates: [
      `activity:${activity.id}`,
      ...(activity.parentId ? [`activity:${activity.parentId}`] : []),
      'outline',
    ],
  };
}

export const update_activity: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};

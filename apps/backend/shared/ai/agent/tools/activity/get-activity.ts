import { stripIndent } from 'common-tags';
import type { ToolContext, ToolDef } from '../types.ts';
import { toolError } from '../helpers/index.ts';
import { findActivity, summarizeActivity } from './helpers.ts';

const TOOL = 'get_activity';

interface Input {
  id: number;
}

const description = stripIndent`
  Fetch a single activity by id with its full data object.
  Use before update_activity or attach_asset_to_activity to
  inspect the current state. For the full content tree under
  a topic, use get_activity_subtree instead.
`;

const parameters = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'Activity id to fetch.',
    },
  },
  required: ['id'],
  additionalProperties: false,
};

/**
 * Fetch one activity by id. Returns the summary plus
 * the full data object so the LLM can inspect all
 * schema-defined meta fields.
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
  return {
    ...summarizeActivity(activity),
    data: activity.data,
  };
}

export const get_activity: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

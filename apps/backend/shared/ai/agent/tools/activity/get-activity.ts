import { stripIndent } from 'common-tags';

import {
  computeMissingMeta,
  findActivity,
  summarizeActivity,
} from './helpers.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { toolError } from '../helpers/index.ts';

const TOOL = 'get_activity';

interface Input {
  id: number;
}

const description = stripIndent`
  Fetch a single activity by id with its full data object and a
  missingMeta list (schema-defined meta keys still unset on this
  activity). Use before update_activity or attach_asset_to_activity
  to inspect the current state and see what fields to fill. Call
  get_schema_info for the meta key types and labels. For the full
  content tree under a outline activity (children, containers, elements),
  use get_activity_subtree instead.
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
 * Fetch one activity by id. Returns the summary, full data, and
 * missingMeta (schema-defined meta keys still unset) so the LLM
 * can decide what to patch via update_activity without an extra
 * subtree fetch.
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
  const missingMeta = computeMissingMeta(ctx.repository.schema, activity);
  return {
    ...summarizeActivity(activity),
    data: activity.data,
    ...(missingMeta.length ? { missingMeta } : {}),
  };
}

export const get_activity: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

import { stripIndent } from 'common-tags';
import type { ToolContext, ToolDef } from '../types.ts';
import { toolError } from '../helpers/index.ts';
import { describeSubtree, findActivity, summarizeActivity } from './helpers.ts';

const TOOL = 'get_activity_subtree';

interface Input {
  activityId: number;
}

const description = stripIndent`
  Return the full nested content tree under an activity -
  child activities, containers, subcontainers, and content
  elements with data previews. Recursively walks the full
  depth regardless of nesting level. Both the outline
  hierarchy and container nesting are schema-defined so
  never assume a fixed structure.

  Each node lists missingMeta (schema-defined meta keys still unset
  on that activity). A non-outline node with missingMeta and zero
  elements is an empty stub - typically editor scaffolding
  materialised from the container's defaultSubcontainers. Fill stubs
  in place via update_activity + add_elements_to_activity, or delete
  them via delete_activity before calling
  create_container_with_elements so the new subcontainers don't sit
  alongside empty defaults.

  Call get_schema_info for the meta key types and labels. Call
  this tool before modifying or adding content so you can see
  the current state and find target activity/element ids.
`;

const parameters = {
  type: 'object',
  properties: {
    activityId: {
      type: 'integer',
      description: 'Activity id to inspect.',
    },
  },
  required: ['activityId'],
  additionalProperties: false,
};

/**
 * Fetch the full nested content tree under an activity.
 * Recursively walks all descendants at any depth -
 * containers, subcontainers, and their content elements.
 */
async function execute(input: Input, ctx: ToolContext) {
  const activity = await findActivity(input.activityId, ctx);
  if (!activity) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Activity #${input.activityId} not found.`,
    });
  }

  const subtree = await describeSubtree(ctx.repository.schema, activity);

  return {
    activity: summarizeActivity(activity),
    subtree,
  };
}

export const get_activity_subtree: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

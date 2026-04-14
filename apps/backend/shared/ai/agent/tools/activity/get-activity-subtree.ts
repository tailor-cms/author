import { stripIndent } from 'common-tags';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  buildLabels,
  describeSubtree,
  findActivity,
  summarizeActivity,
  toolError,
} from '../helpers/index.ts';

const TOOL = 'inspect_activity_subtree';

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
  Call this before modifying or adding content so you can
  see the current state and find target activity/element ids.
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

  const labels = buildLabels(ctx.repository.schema);
  const subtree = await describeSubtree(
    ctx.repository.id, activity, labels,
  );

  return {
    activity: summarizeActivity(activity),
    subtree,
  };
}

export const inspect_activity_subtree: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

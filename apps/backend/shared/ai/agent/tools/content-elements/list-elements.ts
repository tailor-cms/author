import { stripIndent } from 'common-tags';
import db from '#shared/database/index.js';
import type { ToolContext, ToolDef } from '../types.ts';
import { findActivity, toolError } from '../helpers/index.ts';

const { ContentElement } = db as any;

const TOOL = 'list_elements';

interface Input {
  activityId: number;
}

const description = stripIndent`
  List content elements inside a specific activity with
  full data. Use when you know the target activity id
  (e.g. from get_activity_subtree). For the full nested
  tree under a topic, use get_activity_subtree instead.
  Use add_elements_to_activity to add new elements,
  update_element or refine_element to modify existing ones.
`;

const parameters = {
  type: 'object',
  properties: {
    activityId: {
      type: 'integer',
      description: 'Activity id containing the elements.',
    },
  },
  required: ['activityId'],
  additionalProperties: false,
};

/**
 * List all content elements belonging to an activity,
 * ordered by position. Returns full element data so
 * the LLM can inspect content without follow-up calls.
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
  const elements = await ContentElement.findAll({
    where: {
      repositoryId: ctx.repository.id,
      activityId: input.activityId,
      detached: false,
    },
    order: [['position', 'ASC']],
  });
  return {
    activityId: input.activityId,
    elements,
  };
}

export const list_elements: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

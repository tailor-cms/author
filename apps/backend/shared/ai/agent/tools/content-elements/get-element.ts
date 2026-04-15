import { stripIndent } from 'common-tags';
import type { ToolContext, ToolDef } from '../types.ts';
import { findElement, toolError } from '../helpers/index.ts';

const TOOL = 'get_element';

interface Input {
  id: number;
}

const description = stripIndent`
  Fetch a single content element by id with its full data
  and meta. Use before refine_element or update_element to
  inspect the current state, or to read element content
  when list_elements isn't needed (e.g. after a user
  references a specific element by id).
`;

const parameters = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'Content element id to fetch.',
    },
  },
  required: ['id'],
  additionalProperties: false,
};

/**
 * Fetch one content element by id. Returns the full
 * Sequelize entity including data and meta.
 */
async function execute(input: Input, ctx: ToolContext) {
  const element = await findElement(input.id, ctx);
  if (!element) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Element #${input.id} not found.`,
    });
  }
  return element;
}

export const get_element: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

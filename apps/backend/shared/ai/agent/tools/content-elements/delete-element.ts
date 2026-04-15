import { stripIndent } from 'common-tags';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  dbContext,
  findElement,
  recordOperation,
  toolError,
} from '../helpers/index.ts';

const TOOL = 'delete_element';

interface Input {
  id: number;
}

const description = stripIndent`
  Soft-delete a content element. The element's revision
  history is preserved. Prefer update_element or
  refine_element for fixes and rewrites - delete only
  when the element should be removed entirely. This is
  a destructive action that requires approval in safe mode.
`;

const parameters = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'Content element id to delete.',
    },
  },
  required: ['id'],
  additionalProperties: false,
};

/**
 * Soft-delete a content element. Captures a snapshot
 * for undo via add_elements_to_activity inverse.
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
  try {
    // Soft-delete: sets deletedAt, revision preserved.
    // Paranoid mode keeps the record - restorable by clearing deletedAt.
    await element.destroy({ context: dbContext(ctx) });
  } catch (error: any) {
    return toolError({
      tool: TOOL,
      reason: 'failed',
      message: error.message,
    });
  }
  const result = {
    ok: true,
    id: input.id,
    _invalidates: [`element:${input.id}`, `activity:${element.activityId}`],
  };
  // TODO: implement restore_element tool (clear deletedAt)
  // for proper undo, same pattern as restore_activity
  recordOperation(TOOL, input, result, ctx);
  return result;
}

export const delete_element: ToolDef = {
  name: TOOL,
  scope: 'destructive',
  description,
  parameters,
  execute,
};

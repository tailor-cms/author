import { oneLine, stripIndent } from 'common-tags';
import type { ToolContext, ToolDef } from '../types.ts';
import { dbContext, recordOperation, toolError } from '../helpers/index.ts';
import { findElement, normalizeElementData } from './helpers.ts';

const TOOL = 'update_element';

interface Input {
  id: number;
  position?: number | null;
  data?: Record<string, any> | null;
  meta?: Record<string, any> | null;
}

const description = stripIndent`
  Patch an existing content element's data, position, or
  meta. Fields are shallow-merged into existing values so
  you only need to pass changed fields. Use when you know
  exactly what to change. For open-ended rewrites based on
  instructions, use refine_element instead. Inspect the
  element's current data via get_element before patching.
`;

const parameters = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'Content element id to update.',
    },
    data: {
      type: ['object', 'null'],
      description: oneLine`
        Fields to shallow-merge into element data.
        Structure depends on element type - call
        get_schema_info for element data schemas.
      `,
      additionalProperties: true,
    },
    position: {
      type: ['integer', 'null'],
      description: '1-based position among siblings.',
    },
    meta: {
      type: ['object', 'null'],
      description: 'Fields to shallow-merge into element meta.',
      additionalProperties: true,
    },
  },
  required: ['id'],
  additionalProperties: false,
};

/**
 * Build a shallow-merge patch from the input fields
 * against the existing element state.
 */
function buildPatch(element: any, input: Input) {
  const patch: any = {};
  if (input.data) {
    const merged = { ...element.data, ...input.data };
    patch.data = normalizeElementData(element.type, merged);
  }
  if (typeof input.position === 'number') {
    patch.position = input.position;
  }
  if (input.meta) {
    patch.meta = { ...element.meta, ...input.meta };
  }
  return patch;
}

/**
 * Patch an existing content element. Shallow-merges
 * data and meta, captures previous state for undo.
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

  const previousData = element.data;
  const previousPosition = element.position;
  const previousMeta = element.meta;

  const patch = buildPatch(element, input);
  if (!Object.keys(patch).length) {
    return toolError({
      tool: TOOL,
      reason: 'empty_patch',
      message: 'No fields to update.',
    });
  }

  try {
    await element.update(patch, { context: dbContext(ctx) });
  } catch (error: any) {
    return toolError({
      tool: TOOL,
      reason: 'failed',
      message: error.message,
    });
  }
  const result = {
    ok: true,
    element,
    _invalidates: [
      `element:${element.id}`,
      `activity:${element.activityId}`,
    ],
  };
  recordOperation(TOOL, input, result, ctx, {
    tool: TOOL,
    input: {
      id: element.id,
      data: previousData,
      position: previousPosition,
      meta: previousMeta,
    },
  });
  return result;
}

export const update_element: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};

import { oneLine, stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import db from '#shared/database/index.js';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  dbContext,
  recordOperation,
  resolveOutlineType,
  toolError,
} from '../helpers/index.ts';
import { findActivity, nextPosition, summarizeActivity } from './helpers.ts';

const { Activity } = db as any;
const api = schemaAPI as any;

const TOOL = 'create_activity';

interface Input {
  type: string;
  parentId?: number | null;
  position?: number | null;
  data: { name: string; [key: string]: any };
}

const description = stripIndent`
  Create a new outline activity. The type must be one of
  the schema's outline types - call get_schema_info if unsure.
  Bare or namespaced types both work. Rejects container types
  - use create_container_with_elements for those.
`;

const parameters = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      description: oneLine`
        Outline activity type. Call get_schema_info
        for allowed values.
      `,
    },
    parentId: {
      type: ['integer', 'null'],
      description: oneLine`
        Parent activity id, or null for
        root-level types.
      `,
    },
    position: {
      type: ['integer', 'null'],
      description: oneLine`
        1-based insertion position among
        siblings. Omit to append at the end.
      `,
    },
    data: {
      type: 'object',
      description: oneLine`
        Activity data object. Must include
        { name: string }. May include additional
        meta keys defined in the schema (e.g.
        description, estimatedTime, tags). Use get_schema_info
        to check for allowed/required meta properties for the type.
      `,
      properties: { name: { type: 'string' } },
      required: ['name'],
      additionalProperties: true,
    },
  },
  required: ['type', 'data'],
  additionalProperties: false,
};

/**
 * Build an error listing allowed outline types
 * so the LLM can self-correct on retry.
 *
 * @param schemaId - Repository schema id
 * @param type - The rejected type string
 * @returns Error with allowedOutlineTypes
 */
function rejectNonOutline(schemaId: string, type: string) {
  const levels = api.getOutlineLevels(schemaId);
  return toolError({
    tool: TOOL,
    reason: 'invalid_type',
    message: `"${type}" is not an outline activity type.`,
    allowedOutlineTypes: levels.map((it: any) => it.type),
    hint: oneLine`
      Use create_container_with_elements
      for non-outline activities (content containers).
    `,
  });
}

/**
 * Validate that the parent-child relationship is
 * allowed by the schema.
 *
 * @param type - Namespaced activity type
 * @param parentId - Parent activity id or null
 * @param ctx - Tool context
 * @returns Error response or null if valid
 */
async function validateParent(
  type: string,
  parentId: number | null | undefined,
  ctx: ToolContext,
) {
  const config = api.getLevel(type);
  if (!parentId) {
    if (config && !config.rootLevel) {
      return toolError({
        tool: TOOL,
        reason: 'parent_required',
        message: `"${type}" needs a parent.`,
      });
    }
    return null;
  }
  const parent = await findActivity(parentId, ctx);
  if (!parent) {
    return toolError({
      tool: TOOL,
      reason: 'parent_not_found',
      message: `Parent #${parentId} not found.`,
      hint: 'Call get_outline for current ids.',
    });
  }
  const parentConfig = api.getLevel(parent.type);
  const allowed = parentConfig?.subLevels || [];
  if (!allowed.length || allowed.includes(type)) {
    return null;
  }
  return toolError({
    tool: TOOL,
    reason: 'invalid_child',
    message: oneLine`
      "${type}" cannot be a child
      of "${parent.type}".
    `,
    allowedChildTypes: allowed,
    hint: `Allowed: ${allowed.join(', ')}`,
  });
}

/**
 * Create a single outline activity in the repository.
 *
 * @param input - Tool input from the LLM
 * @param ctx - Tool context
 * @returns Created activity summary or error
 */
async function execute(input: Input, ctx: ToolContext) {
  const schemaId = ctx.repository.schema;
  const type = resolveOutlineType(schemaId, input.type);
  if (!type || !api.isOutlineActivity(type)) {
    return rejectNonOutline(schemaId, input.type);
  }
  const parentError = await validateParent(type, input.parentId, ctx);
  if (parentError) return parentError;
  const outlineConfig = api.getLevel(type);
  // Use explicit position if provided, otherwise
  // append after the last sibling.
  const position =
    typeof input.position === 'number'
      ? input.position
      : await nextPosition(ctx.repository.id, input.parentId ?? null);

  try {
    const created = await Activity.create(
      {
        type,
        parentId: input.parentId ?? null,
        position,
        data: {
          ...(outlineConfig?.defaultMeta ?? {}),
          ...input.data,
        },
        repositoryId: ctx.repository.id,
      },
      { context: dbContext(ctx) },
    );

    const summary = summarizeActivity(created);
    // Inverse: delete what we just created (for undo)
    recordOperation(TOOL, input, summary, ctx, {
      tool: 'delete_activity',
      input: { id: created.id },
    });
    return {
      ok: true,
      ...summary,
      _invalidates: ['outline'],
    };
  } catch (err: any) {
    return toolError({
      tool: TOOL,
      reason: 'failed',
      message: err.message,
    });
  }
}

export const create_activity: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};

import { oneLine, stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import db from '#shared/database/index.js';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  dbContext,
  failWith,
  findActivity,
  nextPosition,
  recordOperation,
  resolveOutlineType,
  summarizeActivity,
} from '../helpers/index.ts';

const { Activity } = db as any;
const api = schemaAPI as any;

interface Input {
  type: string;
  parentId?: number | null;
  position?: number | null;
  data: { name: string; [key: string]: any };
}

const description = stripIndent`
  Create a new outline activity. The type must be
  one of the schema's outline types - call
  get_schema_info if unsure. Bare or namespaced
  types both work. Rejects container types - use
  create_subcontainer_with_elements for those.
`;

const parameters = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      description: oneLine`
        Outline type. Call get_schema_info
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
        description, estimatedTime, tags).
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
function rejectNonOutline(
  schemaId: string,
  type: string,
) {
  const levels = api.getOutlineLevels(schemaId);
  const allowed = levels.map((it: any) => it.type);
  return failWith(
    'activity.invalid_type',
    `"${type}" is not an outline type.`,
    {
      allowedOutlineTypes: allowed,
      hint: oneLine`
        Use create_subcontainer_with_elements
        for content sections.
      `,
    },
  );
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
      return failWith(
        'activity.parent_required',
        `"${type}" needs a parent.`,
      );
    }
    return null;
  }
  const parent = await findActivity(parentId, ctx);
  if (!parent) {
    return failWith(
      'activity.parent_not_found',
      `Parent #${parentId} not found.`,
      { hint: 'Call list_outline for current ids.' },
    );
  }
  const parentConfig = api.getLevel(parent.type);
  const allowed = parentConfig?.subLevels || [];
  if (!allowed.length || allowed.includes(type)) {
    return null;
  }
  return failWith(
    'activity.invalid_child_type',
    `"${type}" cannot be a child of "${parent.type}".`,
    {
      allowedChildTypes: allowed,
      hint: `Allowed: ${allowed.join(', ')}`,
    },
  );
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
  if (!api.isOutlineActivity(type)) {
    return rejectNonOutline(schemaId, input.type);
  }
  const parentError = await validateParent(
    type, input.parentId, ctx,
  );
  if (parentError) return parentError;
  const outlineConfig = api.getLevel(type);
  // Use explicit position if provided, otherwise
  // append after the last sibling.
  const position = typeof input.position === 'number'
    ? input.position
    : await nextPosition(
        ctx.repository.id,
        input.parentId ?? null,
      );

  try {
    const created = await Activity.create({
      type,
      parentId: input.parentId ?? null,
      position,
      data: {
        ...(outlineConfig?.defaultMeta ?? {}),
        ...input.data,
      },
      repositoryId: ctx.repository.id,
    }, { context: dbContext(ctx) });

    const summary = summarizeActivity(created);
    recordOperation(
      ctx, 'create_activity', input, summary,
      {
        tool: 'delete_activity',
        input: { id: created.id },
      },
    );
    return {
      ok: true,
      ...summary,
      _invalidates: ['outline'],
    };
  } catch (err: any) {
    return failWith('activity.create_failed', err.message);
  }
}

export const create_activity: ToolDef = {
  name: 'create_activity',
  scope: 'write',
  description,
  parameters,
  execute,
};

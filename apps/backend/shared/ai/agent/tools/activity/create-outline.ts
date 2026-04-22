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
import { nextPosition, summarizeActivity } from './helpers.ts';

const { Activity } = db as any;
const api = schemaAPI as any;

const TOOL = 'create_outline';

interface ActivityItem {
  type: string;
  name: string;
  _parentName?: string | null;
  [key: string]: any;
}

interface Input {
  activities: ActivityItem[];
}

/**
 * Per-node error collected during batch creation.
 * Batched in the result's errors array.
 */
interface NodeError {
  name: string;
  error: string;
}

const description = stripIndent`
  Batch-create an entire outline tree from a generate_outline
  result. Pass the activities array directly - parent-child
  relationships are resolved via _parentName. Schema-defined
  meta fields (e.g. description, estimatedTime, tags) are passed
  through to activity.data. Call get_schema_info to discover
  which meta properties each activity type supports.
`;

const parameters = {
  type: 'object',
  properties: {
    activities: {
      type: 'array',
      description: oneLine`
        Flat activity list from generate_outline. Each item has
        type, name, and optional _parentName for hierarchy.
        Additional data fields (e.g. description, estimatedTime, tags)
        are stored in activity.data. Call get_schema_info to see
        allowed meta properties per type.
      `,
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: oneLine`
              Outline activity type. Bare or namespaced
              (e.g. MODULE or SCHEMA/MODULE).
            `,
          },
          name: {
            type: 'string',
            description: 'Display name for the activity.',
          },
          _parentName: {
            type: ['string', 'null'],
            description: oneLine`
              Name of the parent activity in this batch.
              Null or omit for root-level nodes.
            `,
          },
        },
        required: ['type', 'name'],
        additionalProperties: true,
      },
    },
  },
  required: ['activities'],
  additionalProperties: false,
};

/**
 * Validate that a child type is allowed under its
 * parent according to the schema's subLevels.
 *
 * @param parentType - Namespaced parent activity type
 * @param childType - Namespaced child activity type
 * @returns Error message string or null if valid
 */
function validateSubLevel(
  parentType: string,
  childType: string,
): string | null {
  const parentConfig = api.getLevel(parentType);
  const allowed = parentConfig?.subLevels || [];
  if (!allowed.length || allowed.includes(childType)) {
    return null;
  }
  return oneLine`
    "${childType}" not allowed under "${parentType}".
    Allowed: ${allowed.join(', ')}
  `;
}

/**
 * Create a single node in the outline tree. Resolves type,
 * validates parent-child via subLevels, and spreads meta
 * fields into activity.data.
 *
 * @param item - Activity item from the input array
 * @param activityByName - Lookup of already-created activities
 * @param ctx - Tool context
 * @returns Created activity or per-node error
 */
async function createNode(
  item: ActivityItem,
  activityByName: Map<string, any>,
  ctx: ToolContext,
): Promise<{ activity: any } | { error: NodeError }> {
  const type = resolveOutlineType(ctx.repository.schema, item.type);
  if (!type || !api.isOutlineActivity(type)) {
    return {
      error: {
        name: item.name,
        error: `"${item.type}" is not an outline activity type.`,
      },
    };
  }

  const outlineConfig = api.getLevel(type);
  // Resolve parent from already-created activities
  let parentId: number | null = null;
  if (item._parentName) {
    const parent = activityByName.get(item._parentName);
    if (!parent) {
      return {
        error: {
          name: item.name,
          error: `Parent "${item._parentName}" not found.`,
        },
      };
    }
    parentId = parent.id;
    const violation = validateSubLevel(parent.type, type);
    if (violation) {
      return { error: { name: item.name, error: violation } };
    }
  } else if (outlineConfig && !outlineConfig.rootLevel) {
    return {
      error: {
        name: item.name,
        error: `"${item.type}" cannot be a root-level activity.`,
      },
    };
  }
  const position = await nextPosition(ctx.repository.id, parentId);
  const { type: _type, _parentName: _parent, name, ...meta } = item;
  try {
    const activity = await Activity.create(
      {
        type,
        parentId,
        position,
        data: {
          ...(outlineConfig?.defaultMeta ?? {}),
          name,
          ...meta,
        },
        repositoryId: ctx.repository.id,
      },
      { context: dbContext(ctx) },
    );
    return { activity };
  } catch (err: any) {
    return { error: { name: item.name, error: err.message } };
  }
}

/**
 * Batch-create all activities from a generate_outline
 * result. Iterates in order so parents are created
 * before children and _parentName resolves.
 *
 * @param input - Tool input from the LLM
 * @param ctx - Tool context
 * @returns Summary with created/failed counts
 */
async function execute(input: Input, ctx: ToolContext) {
  if (!input.activities?.length) {
    return toolError({
      tool: TOOL,
      reason: 'empty',
      message: 'No activities to create.',
    });
  }

  const activityByName = new Map<string, any>();
  const created: any[] = [];
  const errors: NodeError[] = [];

  for (const item of input.activities) {
    const result = await createNode(item, activityByName, ctx);
    if ('error' in result) {
      errors.push(result.error);
    } else {
      activityByName.set(item.name, result.activity);
      created.push(summarizeActivity(result.activity));
    }
  }

  const output = {
    ok: true,
    created: created.length,
    failed: errors.length,
    activities: created,
    ...(errors.length ? { errors } : {}),
    _invalidates: ['outline'],
  };
  recordOperation(TOOL, input, output, ctx);
  return output;
}

export const create_outline: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};

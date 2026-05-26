import { oneLine, stripIndent } from 'common-tags';
import db from '#shared/database/index.js';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  containerTypesForActivity,
  dbContext,
  logger,
  mergeMetaDefaults,
  recordOperation,
  getContainerActivityMeta,
  subcontainerTypesForContainer,
  toolError,
} from '../helpers/index.ts';
import { findActivity, nextPosition, summarizeActivity } from './helpers.ts';
import { createElements } from '../content-elements/helpers.ts';

const { Activity } = db as any;

const TOOL = 'create_container_with_elements';

interface ElementItem {
  type: string;
  data: Record<string, any>;
}

interface Input {
  outlineActivityId: number;
  containerType: string;
  data?: Record<string, any>;
  elements: ElementItem[];
}

interface ToolResultContext {
  outlineActivity: any;
  container: any;
  subcontainer?: any | null;
  elements: any[];
  expectedKeys?: string[];
  missingKeys?: string[];
}

const description = stripIndent`
  Persist content for an outline activity in ONE call. When called
  after generate_container_content, pass BOTH item.data (subcontainer
  metadata defined by the schema, e.g. a SECTION might expose
  title/description/mood/layout) AND item.elements verbatim - never
  just elements. Splitting into a bare create + a follow-up
  update_activity is wasteful and produces an empty-meta
  intermediate state. Resolves the container layer from the schema
  automatically: nested templates get a typed subcontainer with the
  meta from data; flat templates attach elements directly.

  This tool always APPENDS a fresh subcontainer. If the target
  container already holds empty subcontainer stubs (editor
  scaffolding materialised from defaultSubcontainers), they will
  sit alongside the new ones - inspect with get_activity_subtree
  first and delete unwanted stubs via delete_activity (or fill
  them in place via update_activity + add_elements_to_activity)
  BEFORE calling this tool (unless USER specifies otherwise,
  e.g. adding additional items).

  Some missing meta keys are defaulted, but you should always supply the
  complete data object the generator produced. Call get_schema_info
  to see which meta fields each container type defines.
`;

const parameters = {
  type: 'object',
  properties: {
    outlineActivityId: {
      type: 'integer',
      description: oneLine`
        Outline activity (e.g. topic) to create content for.
        The container layer is resolved from the schema.
      `,
    },
    containerType: {
      type: 'string',
      description: oneLine`
        Container or subcontainer type (e.g. DEFAULT_SECTION,
        ASSESSMENT_GROUP). Call get_schema_info for allowed
        values per outline activity type.
      `,
    },
    data: {
      type: 'object',
      description: oneLine`
        Subcontainer metadata. Pass item.data from
        generate_container_content verbatim - it already contains
        the schema-defined fields for this container type
        (e.g. a comic Panel has title/description/mood/layout;
        other templates expose their own keys). Call
        get_schema_info to see the exact fields. Pass {} only for
        flat containers with no metadata. Never omit; never split
        into a bare create + follow-up update_activity.
      `,
      additionalProperties: true,
    },
    elements: {
      type: 'array',
      description: oneLine`
        Content elements to create inside the container, in
        display order. Allowed element types depend on the
        container - call get_schema_info to see which types
        each container supports.
      `,
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: oneLine`
              Content element type. Must be one of the types
              listed in get_schema_info for this container.
            `,
          },
          data: {
            type: 'object',
            description: 'Element payload - structure varies by type.',
            additionalProperties: true,
          },
        },
        required: ['type', 'data'],
        additionalProperties: true,
      },
    },
  },
  required: ['outlineActivityId', 'containerType', 'data', 'elements'],
  additionalProperties: false,
};

/**
 * Build the tool result from created activities and elements.
 * Includes a warning if any meta fields were auto-filled.
 */
function buildToolResult(opts: ToolResultContext) {
  const {
    outlineActivity,
    container,
    subcontainer,
    elements,
    missingKeys,
    expectedKeys,
  } = opts;
  const result: any = {
    ok: true,
    container: summarizeActivity(container),
    subcontainer: subcontainer ? summarizeActivity(subcontainer) : null,
    elements,
    _invalidates: [
      'outline',
      `activity:${outlineActivity.id}`,
      `activity:${container.id}`,
    ],
  };
  if (missingKeys?.length) {
    result.warning = {
      kind: 'meta_fields_defaulted',
      missingKeys,
      expectedKeys,
    };
  }
  return result;
}

/**
 * Flat container path - elements go directly into the
 * container with no subcontainer layer.
 *
 * @param outlineActivity - Outline activity
 * @param container - Container activity
 * @param input - Tool input from the LLM
 * @param ctx - Tool context
 * @returns Formatted result
 */
async function createFlatContainer(
  outlineActivity: any,
  container: any,
  input: Input,
  ctx: ToolContext,
) {
  const elements = await createElements(container.id, input.elements, ctx);
  const result = buildToolResult({ outlineActivity, container, elements });
  recordOperation(TOOL, input, result, ctx);
  return result;
}

/**
 * Nested container path - create a subcontainer with
 * schema-filled metadata, then create content elements
 * inside it.
 *
 * @param outlineActivity - Outline activity
 * @param container - Container activity
 * @param input - Tool input from the LLM
 * @param ctx - Tool context
 * @returns Formatted result with optional meta warning
 */
async function createNestedContainer(
  outlineActivity: any,
  container: any,
  input: Input,
  ctx: ToolContext,
) {
  const { containerType } = input;
  const metaFields = getContainerActivityMeta(
    ctx.repository.schema,
    containerType,
  );
  const { mergedData, missingKeys, expectedKeys } = mergeMetaDefaults(
    metaFields,
    input.data || {},
  );

  if (missingKeys.length) {
    logger.warn({ containerType, missingKeys }, 'meta fields defaulted');
  }

  const subcontainer = await Activity.create(
    {
      type: containerType,
      parentId: container.id,
      position: await nextPosition(ctx.repository.id, container.id),
      data: mergedData,
      repositoryId: ctx.repository.id,
    },
    { context: dbContext(ctx) },
  );

  const elements = await createElements(subcontainer.id, input.elements, ctx);

  const result = buildToolResult({
    outlineActivity,
    container,
    subcontainer,
    elements,
    missingKeys,
    expectedKeys,
  });
  // Inverse: delete the subcontainer (cascades elements)
  // TODO: consider force-delete / suspend revision generation
  // during AI runs so cleanup doesn't create N revision entries
  recordOperation(TOOL, input, result, ctx, {
    tool: 'delete_activity',
    input: { id: subcontainer.id },
  });
  return result;
}

/**
 * Find or create the container activity for an outline
 * activity. Mirrors the editor's `required: true`
 * behaviour - if the container doesn't exist yet
 * (user never opened the outline leaf), create it.
 */
async function findOrCreateContainer(
  outlineActivity: any,
  containerType: string,
  ctx: ToolContext,
) {
  const existing = await Activity.findOne({
    where: {
      repositoryId: ctx.repository.id,
      parentId: outlineActivity.id,
      type: containerType,
      detached: false,
    },
  });
  if (existing) return existing;

  const pos = await nextPosition(
    ctx.repository.id, outlineActivity.id,
  );

  return Activity.create({
    type: containerType,
    parentId: outlineActivity.id,
    position: pos,
    data: {},
    repositoryId: ctx.repository.id,
  }, { context: dbContext(ctx) });
}

/**
 * An outline activity can have multiple container types
 * (e.g. Lesson has Intro, Section, AssessmentPool). The
 * LLM passes a containerType like "DEFAULT_SECTION" but
 * doesn't know which parent container owns it. This
 * function walks all container types for the activity and
 * finds the one that contains the requested type - either
 * as a direct flat container or as a nested subcontainer.
 * Returns null if the type isn't valid for any container.
 */
function resolveTargetContainer(
  schemaId: string,
  containerTypes: string[],
  requestedType: string,
): { parentType: string; isFlat: boolean } | null {
  // Check if it matches a top-level container (flat path)
  if (containerTypes.includes(requestedType)) {
    const subTypes = subcontainerTypesForContainer(
      schemaId, requestedType,
    );
    if (!subTypes.length) return { parentType: requestedType, isFlat: true };
  }
  // Check which container has this as a subcontainer type
  for (const it of containerTypes) {
    const subTypes = subcontainerTypesForContainer(schemaId, it);
    if (subTypes.includes(requestedType)) {
      return { parentType: it, isFlat: false };
    }
  }
  return null;
}

/**
 * Create a container with content elements for an outline
 * activity. Resolves the container layer, decides flat vs
 * nested path, and creates everything in one call.
 *
 * @param input - Tool input from the LLM
 * @param ctx - Tool context
 * @returns Created container/elements, or error
 */
async function execute(input: Input, ctx: ToolContext) {
  const outlineActivity = await findActivity(input.outlineActivityId, ctx);
  if (!outlineActivity) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Activity #${input.outlineActivityId} not found.`,
    });
  }
  const allContainerTypes = containerTypesForActivity(outlineActivity.type);
  if (!allContainerTypes.length) {
    return toolError({
      tool: TOOL,
      reason: 'no_containers',
      message: `"${outlineActivity.type}" has no content containers.`,
    });
  }

  // Resolve which parent container owns the requested type.
  // Walk all container types, check their subTypes, and pick
  // the one that contains input.containerType. If the input
  // matches a top-level container directly, use flat path.
  const resolved = resolveTargetContainer(
    ctx.repository.schema, allContainerTypes, input.containerType,
  );
  if (!resolved) {
    return toolError({
      tool: TOOL,
      reason: 'invalid_type',
      message: oneLine`
        "${input.containerType}" is not a valid container type
        for "${outlineActivity.type}".
      `,
      allowedContainerTypes: allContainerTypes,
    });
  }

  const container = await findOrCreateContainer(
    outlineActivity, resolved.parentType, ctx,
  );

  if (resolved.isFlat) {
    return createFlatContainer(outlineActivity, container, input, ctx);
  }

  return createNestedContainer(outlineActivity, container, input, ctx);
}

export const create_container_with_elements: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};

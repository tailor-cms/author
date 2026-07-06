import {
  containerTypesForActivity,
  describeContainerSchema,
  getContainerConfig,
  toolError,
} from '../helpers/index.ts';
import { oneLine, stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import type { ContainerShape } from '../../../schemas/CcContainer/types.ts';
import { describeShape } from '../../../schemas/CcContainer/describer.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import type { AssetReference } from '@tailor-cms/interfaces/ai.ts';
import db from '#shared/database/index.js';
import * as assetService from '../../../../../asset/asset.service.ts';
import AiService from '../../../ai.service.ts';
import { findActivity } from './helpers.ts';
import { prependEnvelope } from '../../context/index.ts';

const { Asset } = db as any;
const api = schemaAPI as any;

const TOOL = 'generate_container_content';

interface Input {
  activityId: number;
  instructions: string;
  containerType?: string | null;
  assetIds?: number[] | null;
  // Opt-out of the auto-built outline-context envelope (ancestors,
  // preceding sibling summaries, style sample, etc.). Default off = include
  // context. Set to true to save tokens when you don't want neighbor
  // awareness (e.g. regenerating a throwaway topic).
  skipOutlineContext?: boolean | null;
  // How many nearest siblings get detailed summaries. Defaults to 2.
  contextRadius?: number | null;
}

const description = stripIndent`
  Generate content for an outline activity's container. The
  output shape is determined by the container's template:
  - Nested templates (container lists subcontainers): items[] of
    subcontainers, each with schema-defined metadata and elements.
  - Flat, multiple: true: items[] where each item is a NEW sibling
    container; data is empty unless the schema declares container
    meta, elements carry the body.
  - Flat, multiple unset/false: exactly one item; elements belong
    inside that container.
  - Collection items (props-shaped): one item with a fully-
    populated data record and no elements.
  Specify containerType to target a specific container
  (call get_schema_info to see types). assetIds (when provided)
  embed library assets as media elements.
  Does NOT persist.
`;

const parameters = {
  type: 'object',
  properties: {
    activityId: {
      type: 'integer',
      description: 'Outline activity to generate content for.',
    },
    instructions: {
      type: 'string',
      description: oneLine`
        What to write. Be specific about scope, length,
        examples, and tone.
      `,
    },
    assetIds: {
      type: ['array', 'null'],
      items: { type: 'integer' },
      description: oneLine`
        Asset ids from the library to include in the generated
        content. Images are inserted as IMAGE elements, other assets
        provide context. Call list_assets to find relevant assets first.
      `,
    },
    skipOutlineContext: {
      type: ['boolean', 'null'],
      description: oneLine`
        Opt out of the auto-built outline-context envelope
        (ancestors, preceding siblings with content summaries,
        repository digest). Default false = include context so the
        generated content does not duplicate neighboring topics.
      `,
    },
    contextRadius: {
      type: ['integer', 'null'],
      description: oneLine`
        How many nearest siblings get detailed summaries in the
        outline-context envelope. Defaults to 2.
      `,
    },
    containerType: {
      type: ['string', 'null'],
      description: oneLine`
        Container type to generate for. This is the parent container
        type, not the subcontainer type. Omit only when the activity
        has a single container type; when multiple exist the tool
        returns the options and you must pick one. Call
        get_schema_info or read CONTAINERS in the system prompt for
        available types.
      `,
    },
  },
  required: ['activityId', 'instructions'],
  additionalProperties: false,
};

// Render a numbered markdown preview of generated items.
function renderPreview(items: any[], typeLabel: string): string {
  return items
    .map((item: any, index: number) => {
      const name = item.data?.title || item.data?.name;
      const count = (item.elements || []).length;
      const heading = name || `${typeLabel} ${index + 1}`;
      return `${index + 1}. **${heading}** - ${count} element(s)`;
    })
    .join('\n');
}

// Resolve asset references with signed URLs so the AI can reference them
async function resolveAssets(
  assetIds: number[] | null | undefined,
  ctx: ToolContext,
): Promise<AssetReference[]> {
  if (!assetIds?.length) return [];
  const assets = await Asset.findAll({
    where: {
      id: assetIds,
      repositoryId: ctx.repository.id,
    },
  });
  const refs: AssetReference[] = [];
  for (const asset of assets) {
    let publicUrl: string | undefined;
    if (asset.storageKey) {
      try {
        const dl = await assetService.getDownloadUrl(asset.storageKey);
        publicUrl = dl.publicUrl;
      } catch {
        /* non-critical */
      }
    }
    refs.push({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      storageKey: asset.storageKey,
      publicUrl,
      meta: {
        description: asset.meta?.description,
        tags: asset.meta?.tags,
        url: asset.meta?.url,
      },
    });
  }
  return refs;
}

async function execute(input: Input, ctx: ToolContext) {
  if (!(AiService as any).generate) {
    return toolError({
      tool: TOOL,
      reason: 'ai_disabled',
      message: 'AI not configured.',
    });
  }
  const activity = await findActivity(input.activityId, ctx);
  if (!activity) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Activity #${input.activityId} not found.`,
    });
  }
  const allContainerTypes = containerTypesForActivity(activity.type);
  if (!allContainerTypes.length) {
    return toolError({
      tool: TOOL,
      reason: 'no_containers',
      message: `"${activity.type}" has no content containers.`,
    });
  }
  const schemaId = ctx.repository.schema;
  // When multiple container types exist and none specified,
  // return the options so the model can pick from the activity's
  // schema definition.
  if (!input.containerType && allContainerTypes.length > 1) {
    const activityConfig = api.getLevel(activity.type);
    const options = allContainerTypes.map((type: string) => {
      const schema = describeContainerSchema(schemaId, type);
      const subTypes = (schema.subcontainers || []).map((s: any) => s.type);
      return { type, subcontainerTypes: subTypes };
    });
    return {
      needsSelection: true,
      activityDefinition: activityConfig?.ai?.definition || '',
      availableContainerTypes: options,
      hint: oneLine`
        This activity has multiple container types. Specify
        containerType to generate for a specific one, or call
        this tool once per type as needed.
      `,
    };
  }
  const containerType = input.containerType || allContainerTypes[0];
  if (!allContainerTypes.includes(containerType)) {
    return toolError({
      tool: TOOL,
      reason: 'invalid_container',
      message: oneLine`
        "${containerType}" is not a container type for
        "${activity.type}". Note: pass the parent container
        type, not the subcontainer type.
      `,
      allowedContainerTypes: allContainerTypes,
    });
  }

  const containerCfg = getContainerConfig(schemaId, containerType);
  const shape = describeShape(schemaId, containerType);
  const containerLabel = containerCfg?.label || containerType;
  const assets = await resolveAssets(input.assetIds, ctx);

  const { instructions: instructionsWithContext, meta: envelopeMeta } =
    await prependEnvelope(activity.id, input.instructions, ctx, {
      skip: !!input.skipOutlineContext,
      nearestSiblings: input.contextRadius ?? undefined,
    });

  const generated = await (AiService as any).generate({
    repository: {
      schemaId,
      repositoryId: ctx.repository.id,
      outlineActivityType: activity.type,
      outlineActivityId: activity.id,
      topic: activity.data?.name,
      containerType,
      name: ctx.repository.name,
      description: ctx.repository.description || '',
    },
    inputs: [
      {
        type: 'CREATE',
        text: instructionsWithContext,
        responseSchema: 'CONTAINER',
      },
    ],
    ...(assets.length ? { assets } : {}),
  });

  const items = Array.isArray(generated) ? generated : [];

  return {
    containerType,
    containerSchema: shape,
    items,
    markdown: renderPreview(items, containerLabel),
    ...(envelopeMeta ? { outlineContext: envelopeMeta } : {}),
    NEXT_STEP: nextStepFor(
      shape.shape,
      activity.id,
      containerType,
      items.length,
    ),
  };
}

function nextStepFor(
  shape: ContainerShape,
  activityId: number,
  containerType: string,
  itemCount: number,
): string {
  if (!itemCount) {
    return oneLine`
      No items were generated. Inspect the error log or try
      re-running with different instructions.
    `;
  }
  if (shape === 'props') {
    return oneLine`
      Call create_container_with_elements ONCE with
      outlineActivityId=${activityId},
      containerType="${containerType}", data=items[0].data,
      elements=[] (collection items store all content under data;
      no element rows). Do NOT stop here.
    `;
  }
  if (shape === 'flat') {
    return oneLine`
      Call create_container_with_elements per item with
      outlineActivityId=${activityId},
      containerType=item.type, data=item.data,
      elements=item.elements. Each item is a flat container
      (multi-instance spawns siblings; single-instance
      find-or-creates). Do NOT stop here.
    `;
  }
  return oneLine`
    items[] do NOT persist. Continue per the relevant write recipe
    in the system prompt ("Fill a host with new content") based on
    whether the container already holds defaulted stubs. Do NOT
    stop here.
  `;
}

export const generate_container_content: ToolDef = {
  name: TOOL,
  scope: 'generate',
  description,
  parameters,
  execute,
};

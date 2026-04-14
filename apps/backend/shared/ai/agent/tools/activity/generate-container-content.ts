import { oneLine, stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import AiService from '../../../ai.service.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  containerTypesForActivity,
  describeContainerSchema,
  findActivity,
  toolError,
} from '../helpers/index.ts';

const api = schemaAPI as any;

const TOOL = 'generate_container_content';

interface Input {
  activityId: number;
  instructions: string;
  containerType?: string | null;
}

const description = stripIndent`
  Generate content for an outline activity's container.
  Produces subcontainer data (with schema-defined metadata)
  and content elements matching the container template's
  config. Specify containerType to target a specific
  container or omit to use the primary. Call get_schema_info
  to see available container types per activity. Does NOT
  persist - pass each entry in the items array to
  create_container_with_elements verbatim.
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
    containerType: {
      type: ['string', 'null'],
      description: oneLine`
        Container type to generate for (e.g. SECTION_CONTAINER,
        EXAM). This is the parent container type, not the
        subcontainer type. Omit to use the primary. Call
        get_schema_info to see available types.
      `,
    },
  },
  required: ['activityId', 'instructions'],
  additionalProperties: false,
};

/**
 * Render a numbered markdown preview of generated
 * items showing the type label and element count.
 */
function renderPreview(
  items: any[],
  typeLabel: string,
): string {
  return items.map((item: any, index: number) => {
    const name = item.data?.title || item.data?.name;
    const count = (item.elements || []).length;
    const heading = name || `${typeLabel} ${index + 1}`;
    return `${index + 1}. **${heading}** - ${count} element(s)`;
  }).join('\n');
}

/**
 * Generate content via the AI service for a given outline
 * activity. Resolves the container schema to inform the AI
 * about expected meta fields and element types, then
 * returns the result with schema context for the next step.
 *
 * NOTE: currently uses STRUCTURED_CONTENT as the AI response
 * schema for all container types. Works well for structured
 * content containers but may need per-template response
 * schemas for containers like EXAM or ASSESSMENT_POOL.
 */
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
  // return the options so the LLM can make an informed choice
  // based on the activity's schema definition.
  if (!input.containerType && allContainerTypes.length > 1) {
    const activityConfig = api.getLevel(activity.type);
    const options = allContainerTypes.map((type: string) => {
      const schema = describeContainerSchema(schemaId, type);
      const subTypes = (schema.subcontainers || [])
        .map((s: any) => s.type);
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
  // Resolve container structure from the template
  const containerSchema = describeContainerSchema(schemaId, containerType);
  const subcontainers = containerSchema.subcontainers || [];
  const primarySub = subcontainers[0];
  // TODO: Consolidate with other container schemas
  // Content generation uses the STRUCTURED_CONTENT response
  // schema which builds output from the container's subcontainer
  // config (meta fields + element types). Templates without
  // schema-driven config (e.g. EXAM with hardcoded subcontainers
  // or flat DEFAULT) can't be generated this way - use
  // generate_elements_for_target for those instead.
  if (!primarySub?.meta?.length && !primarySub?.elementConfig?.length) {
    return toolError({
      tool: TOOL,
      reason: 'unsupported_template',
      message: oneLine`
        Container "${containerType}" does not have schema-driven
        subcontainer config. Use generate_elements_for_target to
        generate content elements directly.
      `,
    });
  }
  const metaKeys = primarySub.meta.map((m: any) => m.key);
  const elementTypes = api.getSupportedElementTypes(
    primarySub.elementConfig || [],
  );
  const generated = await (AiService as any).generate({
    repository: {
      schemaId,
      repositoryId: ctx.repository.id,
      outlineActivityType: activity.type,
      activityId: activity.id,
      topic: activity.data?.name,
      containerType,
      name: ctx.repository.name,
      description: ctx.repository.description || '',
    },
    inputs: [{
      type: 'CREATE',
      text: input.instructions,
      responseSchema: 'STRUCTURED_CONTENT',
    }],
  });

  const items = Array.isArray(generated) ? generated : [];
  const targetType = primarySub?.type || containerType;
  const targetLabel = primarySub?.label || targetType;

  return {
    containerType,
    containerSchema: {
      subcontainerTypes: subcontainers.map((s: any) => s.type),
      metaKeys,
      elementTypes,
    },
    items,
    markdown: renderPreview(items, targetLabel),
    NEXT_STEP: oneLine`
      You MUST now call create_container_with_elements for EACH
      item in the items array. Pass data AND elements VERBATIM.
      containerType should be "${targetType}".
      ${metaKeys.length
        ? `Expected data keys: ${metaKeys.join(', ')}.`
        : ''}
      ${elementTypes.length
        ? `Allowed element types: ${elementTypes.join(', ')}.`
        : ''}
      Do NOT stop here.
    `,
  };
}

export const generate_container_content: ToolDef = {
  name: TOOL,
  scope: 'generate',
  description,
  parameters,
  execute,
};

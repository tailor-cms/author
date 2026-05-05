import { oneLine, stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import AiService from '../../../ai.service.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { getAllowedElementTypes, toolError } from '../helpers/index.ts';
import { findActivity } from '../activity/helpers.ts';
import { prependEnvelope } from '../../context/index.ts';

const api = schemaAPI as any;

const TOOL = 'generate_elements_for_target';

interface Input {
  activityId: number;
  instructions: string;
  // See generate_container_content: opt-out for the auto-built envelope.
  skipOutlineContext?: boolean | null;
  contextRadius?: number | null;
}

const description = stripIndent`
  Generate content elements for an existing activity.
  Automatically resolves allowed element types from the
  schema and generates a mix of content (text, questions,
  media) based on the instructions. Returns a flat array -
  pass to add_elements_to_activity to persist. For creating
  new containers with elements, use generate_container_content.
`;

const parameters = {
  type: 'object',
  properties: {
    activityId: {
      type: 'integer',
      description: oneLine`
        Activity to generate elements for. Get the id
        from get_activity_subtree.
      `,
    },
    instructions: {
      type: 'string',
      description: oneLine`
        What to write. Be specific about scope, length,
        difficulty, tone, and what types of content you
        want (text, questions, exercises, etc.).
      `,
    },
    skipOutlineContext: {
      type: ['boolean', 'null'],
      description: oneLine`
        Opt out of the auto-built outline-context envelope.
        Default false = include neighbor awareness.
      `,
    },
    contextRadius: {
      type: ['integer', 'null'],
      description: 'Nearest siblings with detailed summaries. Defaults to 2.',
    },
  },
  required: ['activityId', 'instructions'],
  additionalProperties: false,
};

/**
 * Generate content elements via the AI service. Resolves
 * allowed types from the container schema and passes them
 * to the dynamic ELEMENTS response schema so the AI can
 * produce any supported element type.
 */
async function execute(input: Input, ctx: ToolContext) {
  if (!(AiService as any).generate) {
    return toolError({
      tool: TOOL,
      reason: 'ai_disabled',
      message: 'AI not configured.',
    });
  }

  const target = await findActivity(input.activityId, ctx);
  if (!target) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Activity #${input.activityId} not found.`,
    });
  }

  // Outline activities (topics, modules) don't host elements
  // directly - elements live in their subcontainers. Use
  // get_activity_subtree to find the correct section id.
  if (api.isOutlineActivity(target.type)) {
    return toolError({
      tool: TOOL,
      reason: 'outline_activity',
      message: oneLine`
        Activity #${target.id} is an outline activity
        (${target.type}). Elements must be added to a
        content container inside it. Call get_activity_subtree to
        find container ids.
      `,
    });
  }

  const topic = await target.getFirstOutlineItem();
  const parent = await target.getParent();

  // Resolve allowed element types via describeContainerSchema
  const allowed = getAllowedElementTypes(
    ctx.repository.schema, target.type, parent?.type,
  );
  if (!allowed.length) {
    return toolError({
      tool: TOOL,
      reason: 'no_config',
      message: oneLine`
        Activity #${target.id} (${target.type}) cannot host
        elements. Use get_activity_subtree to find the correct
        subcontainer id.
      `,
    });
  }

  // Build the outline-context envelope (unless opted out) and prepend it
  // to the user instructions so the generated elements complement what
  // the preceding siblings already cover and match the existing voice.
  // Anchor the envelope on the nearest outline ancestor (topic), not the
  // subcontainer itself - sibling awareness is a topic-level concern.
  let instructionsWithContext = input.instructions;
  let envelopeMeta: { charBudgetUsed: number; charBudget: number } | null = null;
  const envelopeAnchorId = topic?.id ?? target.id;
  if (!input.skipOutlineContext && envelopeAnchorId) {
    const envelope = await buildOutlineContext(envelopeAnchorId, ctx, {
      radius: input.contextRadius ?? undefined,
    });
    if (envelope) {
      const formatted = formatEnvelope(envelope);
      instructionsWithContext =
        `${formatted}\n\nUser instructions: ${input.instructions}`;
      envelopeMeta = {
        charBudgetUsed: envelope.charBudgetUsed,
        charBudget: envelope.charBudget,
      };
    }
  }

  // ELEMENTS schema dynamically builds from allowed types
  // so the AI can generate any supported element type
  const generated = await (AiService as any).generate({
    repository: {
      repositoryId: ctx.repository.id,
      activityId: topic?.id,
      schemaId: ctx.repository.schema,
      name: ctx.repository.name,
      description: ctx.repository.description || '',
      outlineActivityType: topic?.type,
      topic: topic?.data?.name,
    },
    allowedElementTypes: allowed,
    inputs: [{
      type: 'CREATE',
      text: instructionsWithContext,
      responseSchema: 'ELEMENTS',
    }],
  });

  const elements = Array.isArray(generated) ? generated : [];
  return {
    targetActivityId: target.id,
    allowedElementTypes: allowed,
    elements,
    ...(envelopeMeta ? { outlineContext: envelopeMeta } : {}),
    NEXT_STEP: oneLine`
      You MUST now call add_elements_to_activity with
      activityId=${target.id} and the elements array.
      Do NOT stop here.
    `,
  };
}

export const generate_elements_for_target: ToolDef = {
  name: TOOL,
  scope: 'generate',
  description,
  parameters,
  execute,
};

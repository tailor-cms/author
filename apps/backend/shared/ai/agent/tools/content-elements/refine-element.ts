import { oneLine, stripIndent } from 'common-tags';
import AiService from '../../../ai.service.ts';
import elementRegistry from '../../../../content-plugins/elementRegistry.js';
import { createAiLogger } from '../../../logger.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import {
  dbContext,
  findElement,
  recordOperation,
  toolError,
} from '../helpers/index.ts';

const logger = createAiLogger('agent.tools.content-elements');

const TOOL = 'refine_element';

interface Input {
  id: number;
  instructions: string;
}

const description = stripIndent`
  Refine an existing content element in place using AI.
  Reads the current content, generates an updated version
  based on instructions, and patches it back. Works for
  any element type with an AI spec (HTML, questions, etc.).
  Use for "rewrite this", "make it shorter", "translate",
  "make this harder", "simplify for beginners". Use
  update_element for direct data changes without AI.
`;

const parameters = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'Content element id to refine.',
    },
    instructions: {
      type: 'string',
      description: oneLine`
        How to change the element. Be specific about tone,
        length, audience, or structural changes needed.
      `,
    },
  },
  required: ['id', 'instructions'],
  additionalProperties: false,
};

/**
 * Resolve the outline activity for AI prompt context.
 * Uses the model's getActivity() + getFirstOutlineItem()
 * to walk up the tree to the nearest outline ancestor.
 */
async function resolveOutlineAncestor(element: any) {
  const activity = await element.getActivity();
  if (!activity) return null;
  return activity.getFirstOutlineItem();
}


/**
 * Refine a content element via the AI service. Sends the
 * current element data through per-element AI generation
 * with MODIFY type, then patches the element with the
 * refined output. Captures previous data for undo.
 */
async function execute(input: Input, ctx: ToolContext) {
  if (!(AiService as any).generate) {
    return toolError({
      tool: TOOL,
      reason: 'ai_disabled',
      message: 'AI not configured.',
    });
  }
  const element = await findElement(input.id, ctx);
  if (!element) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Element #${input.id} not found.`,
    });
  }
  const spec = elementRegistry.getAiConfig(element.type);
  if (!spec) {
    return toolError({
      tool: TOOL,
      reason: 'unsupported_type',
      message: `"${element.type}" has no AI spec.`,
    });
  }
  const topic = await resolveOutlineAncestor(element);
  const previousData = element.data;

  let generated: any;
  try {
    generated = await (AiService as any).generate({
      repository: {
        repositoryId: ctx.repository.id,
        activityId: topic?.id,
        schemaId: ctx.repository.schema,
        name: ctx.repository.name,
        description: ctx.repository.description || '',
        outlineActivityType: topic?.type,
        topic: topic?.data?.name,
      },
      // Current element data as string for the AI MODIFY context
      content: JSON.stringify(element.data),
      inputs: [
        {
          type: 'MODIFY',
          text: input.instructions,
          responseSchema: element.type,
        },
      ],
    });
  } catch (error: any) {
    logger.error(
      { err: error.message, id: element.id },
      'refine generation failed',
    );
    return toolError({
      tool: TOOL,
      reason: 'generation_failed',
      message: error.message,
    });
  }

  // AiService.generate already runs the element type's
  // processResponse (e.g. MULTIPLE_CHOICE adds embeds/questionId).
  // The result is ready to use as element data directly.
  if (!generated) {
    return toolError({
      tool: TOOL,
      reason: 'no_payload',
      message: 'Refinement produced no usable data.',
    });
  }

  try {
    await element.update({ data: generated }, { context: dbContext(ctx) });
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
    _invalidates: [`element:${element.id}`, `activity:${element.activityId}`],
  };
  recordOperation(TOOL, input, result, ctx, {
    tool: 'update_element',
    input: { id: element.id, data: previousData },
  });
  return result;
}

export const refine_element: ToolDef = {
  name: TOOL,
  scope: 'generate',
  description,
  parameters,
  execute,
};

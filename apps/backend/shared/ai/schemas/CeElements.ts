// Content elements generation schema.
// Builds an OpenAI structured output schema from the
// allowed element types on the target activity.
import type { AiContext } from '@tailor-cms/interfaces/ai.ts';

import type { AiResponseSpec, OpenAISchema } from './interfaces.ts';
import {
  buildElementSchema,
  getCeAiSpec,
  resolveSupportedTypes,
} from './CcContainer/schema.ts';

/**
 * Build the OpenAI schema allowing any of the provided
 * element types.
 */
export const Schema = (context: AiContext): OpenAISchema => {
  const types: string[] = (context as any)?.allowedElementTypes || [];
  const supported = resolveSupportedTypes(types);
  const schemas = supported.map(buildElementSchema);
  const elementsItems = schemas.length
    ? (schemas.length === 1 ? schemas[0] : { anyOf: schemas })
    : { type: 'object' };
  return {
    type: 'json_schema',
    name: 'ce_elements',
    schema: {
      type: 'object',
      properties: {
        elements: { type: 'array', items: elementsItems },
      },
      required: ['elements'],
      additionalProperties: false,
    },
  };
};

export const getPrompt = (context?: AiContext) => {
  const types: string[] = (context as any)?.allowedElementTypes || [];
  const supported = resolveSupportedTypes(types);
  const typeList = supported.length ? supported.join(', ') : 'any';
  return `
    Generate content elements as a JSON object with an "elements" array.
    Each element has a "type" field and type-specific data fields.
    Allowed element types: ${typeList}. Only these are valid - each has
    its own schema.
    Use a text element for prose and explanation, and mix in the other
    allowed types so the result holds together as a unit.
    When the allowed types include question elements, place one after
    teaching a concept (not as a quiz dump), one per major idea, choosing
    the question type that best fits it, with clear options and plausible
    distractors.
  `;
};

/**
 * Process each element through its type's processResponse
 * and normalize to { type, data } format.
 */
export const processResponse = (raw: any = {}) => {
  const { elements = [] } = raw;
  const processed = elements.map((el: any) => {
    const { type, ...rawContent } = el;
    const spec = getCeAiSpec(type);
    // processResponse transforms AI output into element data
    // (e.g. MULTIPLE_CHOICE adds embeds/questionId)
    const processedData = spec?.processResponse
      ? spec.processResponse(rawContent)
      : rawContent;
    return { type, data: processedData };
  });
  return { elements: processed };
};

const spec: AiResponseSpec = {
  Schema,
  getPrompt,
  processResponse,
};

export default spec;

// Content elements generation schema.
// Builds an OpenAI structured output schema from the
// allowed element types on the target activity. Reuses
// the same schema building utilities as STRUCTURED_CONTENT
// so both paths support the same element types.
import type { AiContext } from '@tailor-cms/interfaces/ai.ts';

import type { AiResponseSpec, OpenAISchema } from './interfaces.ts';
import {
  buildElementSchema,
  getAiSpec,
  resolveSupportedTypes,
} from './CcStructuredContent/schema.ts';

/**
 * Build the full OpenAI schema allowing any of the
 * provided element types. Returns an { elements: [] }
 * wrapper so the model generates an array.
 */
export const Schema = (context: AiContext): OpenAISchema => {
  const types: string[] = (context as any).allowedElementTypes || [];
  const supported = resolveSupportedTypes(types);
  const schemas = supported.map(buildElementSchema);
  if (!schemas.length) {
    // Fallback to accepting any object
    return {
      name: 'content_elements',
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          elements: { type: 'array', items: { type: 'object' } },
        },
        required: ['elements'],
        additionalProperties: false,
      },
    };
  }
  const items = schemas.length === 1 ? schemas[0] : { anyOf: schemas };
  return {
    type: 'json_schema',
    name: 'ce_elements',
    schema: {
      type: 'object',
      properties: { elements: { type: 'array', items } },
      required: ['elements'],
      additionalProperties: false,
    },
  };
};

export const getPrompt = (context: AiContext) => {
  const types: string[] = (context as any).allowedElementTypes || [];
  const supported = resolveSupportedTypes(types);
  const typeList = supported.length ? supported.join(', ') : 'any';
  return `
    Generate content elements as a JSON object with an "elements" array.
    Each element has a "type" field and type-specific data fields.
    Allowed element types: ${typeList}.
    Mix element types so the result holds together as a unit.
    Reach for the primary forms first:
    - Prose / narrative / explanation: TIPTAP_HTML.
    - Comprehension checks: pick the question type that fits the
      idea - MULTIPLE_CHOICE / SINGLE_CHOICE for distinctions,
      TRUE_FALSE for facts, SHORT_ANSWER / TEXT_RESPONSE for
      open-ended. Each has its own schema in the supported types
      list above; only types in that list are valid.
    Place questions after teaching a concept (not as a quiz dump),
    one per major idea, with clear options and plausible distractors.
  `;
};

/**
 * Process each element through its type's processResponse
 * and normalize to { type, data } format. Each element
 * manifest's processResponse returns the processed DATA
 * (not wrapped in { type, data }), so we wrap it here.
 */
export const processResponse = (data: any = {}) => {
  const { elements } = data;
  if (!elements?.length) return [];
  return elements.map((el: any) => {
    const { type, ...rawContent } = el;
    const spec = getAiSpec(type);
    // processResponse transforms AI output into element data
    // (e.g. MULTIPLE_CHOICE adds embeds/questionId)
    const processedData = spec?.processResponse
      ? spec.processResponse(rawContent)
      : rawContent;
    return { type, data: processedData };
  });
};

const spec: AiResponseSpec = {
  Schema,
  getPrompt,
  processResponse,
};

export default spec;

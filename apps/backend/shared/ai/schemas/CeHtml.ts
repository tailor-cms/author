import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import type { AiResponseSpec, OpenAISchema } from './interfaces.ts';

export const HTML_TYPE = ContentElementType.TiptapHtml;

export const ElementSchema = {
  type: 'object',
  properties: {
    type: { enum: [HTML_TYPE] },
    data: {
      type: 'object',
      properties: { content: { type: 'string' } },
      required: ['content'],
      additionalProperties: false,
    },
  },
  required: ['type', 'data'],
  additionalProperties: false,
};

export const Schema: OpenAISchema = {
  type: 'json_schema',
  name: 'ce_html_elements',
  schema: {
    type: 'object',
    properties: {
      elements: { type: 'array', items: ElementSchema },
    },
    required: ['elements'],
    additionalProperties: false,
  },
};

export const getPrompt = () => `
  Response should be a JSON object such that:
  - [{ type: "${ContentElementType.TiptapHtml}", data: { "content": "" } }]
    format is used, where "content" is the text of the page in HTML format.
  - The array should include more than one element, preferably 5-10 elements.
    Headings might be a good place to split. Don't include more than 5 headings.
  - The content property of each element in the array, should include more
    than 300 words of text if possible.
  - Format the content as a HTML with suitable tags and headings.`;

const spec: AiResponseSpec = {
  Schema,
  getPrompt,
  processResponse: (val) => val?.elements,
};

export default spec;

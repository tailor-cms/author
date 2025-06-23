import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import type { AiResponseSpec, OpenAISchema } from './interfaces.ts';

export const Schema: OpenAISchema = {
  type: 'json_schema',
  name: 'ce_html_elements',
  schema: {
    type: 'object',
    properties: {
      elements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { enum: [ContentElementType.TiptapHtml] },
            data: {
              type: 'object',
              properties: {
                content: { type: 'string' },
              },
              required: ['content'],
              additionalProperties: false,
            },
          },
          required: ['type', 'data'],
          additionalProperties: false,
        },
      },
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
  - Format the content as a HTML with suitable tags and headings.
    Apply the folllowing classes to the tags:
    - Apply text-body-2 mb-5 to the paragraphs
    - Apply text-h3 and mb-7 to the headings`;

const spec: AiResponseSpec = {
  Schema,
  getPrompt,
  processResponse: (val) => val?.elements,
};

export default spec;

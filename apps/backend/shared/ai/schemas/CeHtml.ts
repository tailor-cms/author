import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import type { OpenAISchema } from './utils/OpenAISchema.ts';

export const Schema: OpenAISchema = {
  type: 'json_schema',
  name: 'ce_html_elements',
  schema: {
    type: 'array',
    minItems: 1,
    items: {
      type: 'object',
      required: ['type', 'content'],
      properties: {
        type: { enum: [ContentElementType.TiptapHtml] },
        content: { type: 'string' },
      },
    },
  },
};

export const Prompt = `
  Response should be a JSON object such that:
  - [{ type: "${ContentElementType.TiptapHtml}", "content": "" }] format is
    used, where content is the text of the page.
  - Format the content as a HTML with suitable tags
`;

export default {
  Schema,
  Prompt,
};

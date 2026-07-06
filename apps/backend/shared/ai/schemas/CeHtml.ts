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
    format is used, where "content" is HTML.
  - Split the array into the number of elements that the subject
    naturally calls for - one block per idea. No fixed count.
    Headings are a useful split signal; use them sparingly.
  - Length per element follows the medium and the user's brief - no
    fixed minimum or maximum. A comic caption is a sentence; a
    course lesson can run hundreds of words. Match what the
    request and the host actually need.
  - Format the content as HTML with suitable tags and headings.
  - Structure some content blocks so they work well in collapsible
    panels: start with a heading, followed by focused content.
    Sequences of 3+ such blocks will be converted to accordions
    automatically.
  - Mix content shapes: longer narrative blocks alongside shorter
    heading+content blocks, plus <ul>/<ol> lists, <blockquote>,
    and <strong> for variety where it serves the content.`;

const spec: AiResponseSpec = {
  Schema,
  getPrompt,
  processResponse: (val) => val?.elements,
};

export default spec;

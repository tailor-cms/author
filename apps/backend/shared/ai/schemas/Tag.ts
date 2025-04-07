import type { AiResponseSpec, OpenAISchema } from './interfaces.js';

export const Schema: OpenAISchema = {
  type: 'json_schema',
  name: 'tag_collection',
  schema: {
    type: 'object',
    properties: {
      tags: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    required: ['tags'],
    additionalProperties: false,
  },
};

export const getPrompt = () => `
  Return response as JSON and use the following format:
  ['Example tag a', 'Example tag b', 'Example tag c'].
  The response should not include more than 15 tags. Each tag should be in
  human readable format and should not exceed 30 characters.`;

const spec: AiResponseSpec = {
  Schema,
  getPrompt,
};

export default spec;

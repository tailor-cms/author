import type { OpenAISchema } from './utils/OpenAISchema.ts';

export const Schema: OpenAISchema = {
  type: 'json_schema',
  name: 'tag_collection',
  schema: {
    type: 'array',
    minItems: 2,
    maxItems: 15,
    items: {
      type: 'string',
      maxLength: 30,
    },
  },
};

export const Prompt = `
  Return response as JSON and use the following format:
  ['Example tag a', 'Example tag b', 'Example tag c'].
  The response should not include more than 15 tags. Each tag should be in
  human readable format and should not exceed 30 characters.`;

export default {
  Schema,
  Prompt,
};

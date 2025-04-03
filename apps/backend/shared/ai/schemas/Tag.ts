import type { OpenAISchema } from './utils/OpenAISchema.ts';

export const Schema: OpenAISchema = {
  type: 'json_schema',
  name: 'tag_collection',
  schema: {
    type: 'array',
    minItems: 2,
    items: {
      type: 'string',
    },
  },
};

export default {
  Schema,
};

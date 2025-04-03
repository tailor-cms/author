import type { JSONSchema7 } from 'json-schema';

export interface OpenAISchema {
  type: 'json_schema';
  name: string;
  schema: JSONSchema7;
}

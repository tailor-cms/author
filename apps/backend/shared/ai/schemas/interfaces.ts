import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import type { JSONSchema7 } from 'json-schema';

export interface OpenAISchema {
  type: 'json_schema';
  name: string;
  schema: JSONSchema7;
}

export interface AiResponseSpec {
  // Prompt used to describe the response structure
  getPrompt: (context: AiContext) => string;
  // JSON schema for the OpenAI response formatting
  Schema: OpenAISchema | undefined;
  // Function for additional response processing & validation
  processResponse?: (val: any) => any;
}

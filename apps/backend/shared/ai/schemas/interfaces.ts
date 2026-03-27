import type { AiContext } from '@tailor-cms/interfaces/ai.ts';

export interface OpenAISchema {
  type: 'json_schema';
  name: string;
  schema: Record<string, unknown>;
}

export interface AiResponseSpec {
  // Prompt used to describe the response structure
  getPrompt: (context: AiContext) => string;
  // JSON schema for the OpenAI response formatting (static or context-dependent)
  Schema:
    | OpenAISchema
    | ((context: AiContext) => OpenAISchema)
    | undefined;
  // Function for additional response processing & validation.
  // Context passed for specs that need to resolve references
  // (e.g., assetId → URL in structured content).
  processResponse?: (val: any, context?: AiContext) => any;
}

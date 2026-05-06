import type { AiContext } from '@tailor-cms/interfaces/ai.ts';

export interface OpenAISchema {
  type: 'json_schema';
  name: string;
  schema: Record<string, unknown>;
}

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

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
  // Reasoning effort override for the OpenAI Responses API.
  // Only applied on reasoning-capable models (gpt-5, o-series).
  // Omit to use the model's default ("medium" on reasoning models).
  reasoningEffort?: ReasoningEffort;
}

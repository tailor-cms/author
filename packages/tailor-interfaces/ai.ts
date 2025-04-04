export type AiRequestType = 'ADD' | 'MODIFY';

export interface AiInput {
  type: AiRequestType;
  text: string;
  useSearchTool?: boolean;
}

export interface AiRepositoryContext {
  schemaId: string;
  name: string;
  description: string;
  outlineActivityType?: string;
  outlineLocation?: string;
  containerType?: string;
  topic?: string;
}

export interface AiContext {
  repository?: AiRepositoryContext;
  content?: string;
  inputs: AiInput[];
}

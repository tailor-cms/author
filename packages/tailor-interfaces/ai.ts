export type AIRequestType = 'ADD' | 'MODIFY';

export interface AiInput {
  type: AIRequestType;
  text: string;
  useSearchTool: boolean;
}

export interface AiContext {
  repositoryDescription: string;
  content: string;
  inputs: AiInput[];
}

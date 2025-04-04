export type AIRequestType = 'ADD' | 'MODIFY';

export interface AiInput {
  type: AIRequestType;
  text: string;
  useSearchTool: boolean;
}

export interface AIContext {
  repositoryDescription: string;
  content: string;
  inputs: AiInput[];
}

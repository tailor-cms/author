export enum AiRequestType {
  CREATE = 'CREATE',
  ADD = 'ADD',
  MODIFY = 'MODIFY',
}

export type AiRequestTypeLiteral = `${AiRequestType}`;

export enum AiTargetAudience {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
}

export type AiTargetAudienceLiteral = `${AiTargetAudience}`;

export enum AiResponseSchema {
  CUSTOM = 'CUSTOM',
  HTML = 'HTML',
  OUTLINE = 'OUTLINE',
  QUESTION = 'QUESTION',
  TAG = 'TAG',
}

export type AiResponseSchemaLiteral = `${AiResponseSchema}`;

export interface AiInput {
  type: AiRequestTypeLiteral;
  text: string;
  responseSchema: AiResponseSchemaLiteral;
  targetAudience?: AiTargetAudienceLiteral;
  useImageGenerationTool?: boolean;
  useSearchTool?: boolean;
}

export interface AiRepositoryContext {
  schemaId: string;
  name: string;
  description: string;
  // If content is generated for a specific outline node
  outlineActivityType?: string;
  // If content is generated for a specific outline node
  outlineLocation?: string;
  // If content is generated for a container
  containerType?: string;
  // If content is generated for a container
  containerConfig?: any;
  // General topic of the content, in case of a outline node title of the leaf
  topic?: string;
  // Additional information about the content
  tags?: string[];
}

export interface AiContext {
  repository: AiRepositoryContext;
  content?: string;
  inputs: AiInput[];
}

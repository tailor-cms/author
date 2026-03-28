import type { AssetType, LinkContentType } from './asset.ts';

export enum AiRequestType {
  Create = 'CREATE',
  Add = 'ADD',
  Modify = 'MODIFY',
}

export type AiRequestTypeLiteral = `${AiRequestType}`;

export enum AiTargetAudience {
  Beginner = 'BEGINNER',
  Intermediate = 'INTERMEDIATE',
  Expert = 'EXPERT',
}

export type AiTargetAudienceLiteral = `${AiTargetAudience}`;

export enum AiResponseSchema {
  Custom = 'CUSTOM',
  Html = 'HTML',
  Outline = 'OUTLINE',
  Question = 'QUESTION',
  StructuredContent = 'STRUCTURED_CONTENT',
  Tag = 'TAG',
}

export type AiResponseSchemaLiteral = `${AiResponseSchema}`;

export interface AiInput {
  type: AiRequestTypeLiteral;
  text: string;
  responseSchema: AiResponseSchemaLiteral | string;
  targetAudience?: AiTargetAudienceLiteral;
}

export interface AssetReferenceMeta {
  contentType?: LinkContentType;
  // Permanent URL for link assets
  url?: string;
  description?: string;
  tags?: string[];
  // Marks this asset as a primary knowledge source
  isCoreSource?: boolean;
}

export interface AssetReference {
  id: number;
  name: string;
  type: AssetType;
  // Internal storage key (e.g. repository/1/assets/uuid__f.png)
  storageKey?: string | null;
  // Signed public URL (temporary, for display)
  publicUrl?: string;
  meta?: AssetReferenceMeta;
}

export interface AiRepositoryContext {
  repositoryId?: number;
  // Activity ID for resolving outline hierarchy context
  activityId?: number;
  schemaId: string;
  name: string;
  description: string;
  // If content is generated for a specific outline node
  outlineActivityType?: string;
  // If content is generated for a container
  containerType?: string;
  // General topic of the content, in case of a outline node title of the leaf
  topic?: string;
  // Tags for context (used in outline generation before repository exists)
  tags?: string[];
  // Vector store ID for document-based generation
  vectorStoreId?: string;
}

export interface AiContext {
  repository: AiRepositoryContext;
  content?: string;
  inputs: AiInput[];
  // Available assets from the library for AI to recommend
  assets?: AssetReference[];
}

export interface ImageDescription {
  description: string;
  tags: string[];
  analysis: string;
  quality: 'high' | 'medium' | 'low';
  qualityIssues: string[];
  relevanceScore: number;
  contentSuggestion: string;
}

export interface Metadata {
  key: string;
  type: string;
  label: string;
  placeholder?: string;
  validate: Record<string, any>;
  defaultValue?: any;
}

export interface ElementRelationship {
  key: string;
  label: string;
  placeholder: string;
  multiple: boolean;
  allowedTypes: string[];
}

export interface ElementMetaConfig {
  type: string;
  inputs: Metadata[];
  relationships: ElementRelationship[];
}

export interface ActivityRelationship {
  type: string;
  label: string;
  placeholder: string;
  multiple: boolean;
  searchable: boolean;
  allowEmpty: boolean;
  allowCircularLinks: boolean;
  allowInsideLineage: boolean;
  allowedTypes: string[];
}

export interface AIConfig {
  definition: string;
  outputRules?: {
    prompt: string;
    useDalle?: boolean;
  };
}

export interface ActivityConfig {
  type: string;
  label: string;
  color: string;
  rootLevel?: boolean;
  subLevels?: string[];
  isTrackedInWorkflow?: boolean;
  contentContainers?: string[];
  hasExams?: boolean;
  exams?: Record<string, any>;
  relationships?: ActivityRelationship[];
  meta?: Metadata[];
  ai?: AIConfig;
}

export interface ContentContainer {
  type: string;
  templateId: string;
  label: string;
  multiple?: boolean;
  types?: string[];
  displayHeading?: boolean;
  layout?: boolean;
  config?: Record<string, any>;
  required?: boolean;
  publishedAs?: string;
  ai?: AIConfig;
}

export interface Schema {
  id: string;
  workflowId: string;
  name: string;
  meta?: Metadata[];
  structure: ActivityConfig[];
  contentContainers: ContentContainer[];
  elementMeta?: ElementMetaConfig[];
}

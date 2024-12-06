import type { ContentElement } from './content-element';

export type ElementManifest = Record<string, any>;
export interface ElementRegistry {
  all: ElementManifest[];
  load: (el: ContentElement) => void;
  get: (id: string) => ElementManifest;
}
export interface Metadata {
  key: string;
  type: string;
  label: string;
  placeholder?: string;
  validate?: Record<string, any>;
  defaultValue?: any;
  [key: string]: any;
}

export type Filter = (
  optionEl: ContentElement,
  currentEl: ContentElement,
  elRegistry?: ElementManifest,
) => boolean;

export interface ElementRelationship {
  key: string;
  label: string;
  placeholder: string;
  multiple: boolean;
  allowedTypes: string[];
  filters?: Filter[];
  disableSidebarUi?: boolean;
}

export interface ElementMetaConfig {
  type: string;
  inputs?: Metadata[];
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
  allowedTypes?: string[];
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
  relationships?: ActivityRelationship[];
  meta?: Metadata[];
  defaultMeta?: Record<string, any>;
  ai?: AIConfig;
  // @deprecated use relationships instead
  hasPrerequisites?: boolean;
  // @deprecated will be removed after migrating exam container
  exams?: any;
}

export interface ElementCategory {
  name: string;
  types: string[];
}

export interface ElementTypeConfig {
  id: string;
  allowedEmbedTypes?: string[];
  isGradeable?: boolean;
}

export interface ContentContainer {
  type: string;
  templateId: string;
  label: string;
  multiple?: boolean;
  types?: Array<ElementTypeConfig>;
  categories?: ElementCategory[];
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
  description?: string;
  meta?: Metadata[];
  defaultMeta?: Record<string, any>;
  structure: ActivityConfig[];
  contentContainers: ContentContainer[];
  elementMeta?: ElementMetaConfig[];
  // @deprecated use elementMeta instead
  tesMeta?: ElementMetaConfig[];
}

import type { Activity } from './activity';
import type { ContentElement } from './content-element';
import type { Repository } from './repository';

export type ElementManifest = Record<string, any>;

export interface ElementRegistry {
  all: ElementManifest[];
  questions: ElementManifest[];
  load: (el: ContentElement) => void;
  get: (id: string) => ElementManifest;
  isQuestion: (type: string) => boolean;
  resetData: (element: ContentElement) => ContentElement['data'];
  isLegacyQuestion: (type: string) => boolean;
  matchesAllowedElementConfig: (
    el: ContentElement,
    config: Record<string, any>,
  ) => boolean;
  getByEntity: (el: ContentElement) => ElementManifest;
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
  allowedElementConfig: ContentElementItem[];
  filters?: Filter[];
  disableSidebarUi?: boolean;
}

export interface ElementMetaConfig {
  type: string;
  inputs?: Metadata[];
  relationships?: ElementRelationship[];
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

export interface AiActivityConfig {
  definition: string;
  outputRules?: {
    prompt: string;
    isAssessment?: boolean;
  };
}

/**
 * Type mapping configuration for cross-schema linking.
 * Defined on SOURCE activity config, specifies what it becomes in target schemas.
 */
export interface TypeMappingConfig {
  /**
   * Target activity type
   * (without schema prefix, resolved to full path during processing)
   */
  type: string;
  // Future extensibility:
  // transform?: (sourceData: Record<string, any>) => Record<string, any>;
  // validate?: (source: Activity, context: LinkContext) => boolean;
}

export interface Guideline {
  id: string;
  icon: string;
  title: string;
  description: string;
  metric: Record<string, number | undefined>;
  isDone: () => boolean;
};

export interface ActivityConfig {
  type: string;
  label: string;
  color: string;
  guidelines?: (
    repository: Repository,
    contentContainers: Activity[],
    contentElements: ContentElement[],
    ceRegistry: any,
  ) => Guideline[];
  rootLevel?: boolean;
  subLevels?: string[];
  parentTypes?: string[];
  isTrackedInWorkflow?: boolean;
  contentContainers?: string[];
  relationships?: ActivityRelationship[];
  meta?: Metadata[];
  defaultMeta?: Record<string, any>;
  ai?: AiActivityConfig;
  // Cross-schema type mapping - defined on SOURCE activity.
  // Specifies what this type becomes when linked to other schemas.
  mapsTo?: Record<string, TypeMappingConfig>;
  // @deprecated use relationships instead
  hasPrerequisites?: boolean;
  // @deprecated will be removed after migrating exam container
  exams?: any;
}

export interface ContentElementConfig {
  isGradable?: boolean;
}

export interface ContentElementItem extends ContentElementConfig {
  id: string;
}

export interface ContentElementCategory {
  name: string;
  items: ContentElementItem[];
  config?: ContentElementConfig;
}

export type ElementConfig = ContentElementCategory | ContentElementItem | string;

export interface ContentContainerConfig {
  type: string;
  templateId: string;
  label: string;
  multiple?: boolean;
  types?: ElementConfig[];
  embedElementConfig?: ElementConfig[];
  contentElementConfig?: ElementConfig[];
  displayHeading?: boolean;
  layout?: boolean;
  config?: Record<string, any>;
  required?: boolean;
  publishedAs?: string;
  ai?: AiActivityConfig;
}

/**
 * Structural shape of a container template, produced by a container
 * package's `describeSchema(container)` and aggregated by
 * `ContainerRegistry.describeSchema`. Exactly one of subcontainers /
 * elementConfig / props will be populated, identifying which "shape"
 * the template instantiates:
 *  - subcontainers (+ optional defaultSubcontainers): nested
 *  - elementConfig: flat (any container holding elements directly)
 *  - props: collection-item (named typed slots stored in container.data)
 * Consumers (AI specs, frontend renderers, publishing) branch on the
 * populated key.
 */
export interface ContentSubcontainer {
  type: string;
  label: string;
  meta: Metadata[];
  elementConfig?: ElementConfig[];
}

export interface CollectionProp {
  key: string;
  label: string;
  type: string;
  isContentElement: boolean;
  isGradable?: boolean;
  defaultValue?: unknown;
  required?: boolean;
}

export interface ContainerStructure {
  subcontainers: ContentSubcontainer[];
  defaultSubcontainers?: { type: string; data?: Record<string, unknown> }[];
  elementConfig?: ElementConfig[] | null;
  props?: CollectionProp[];
}

export interface I18nLanguage {
  code: string;
  name: string;
}

export interface I18nConfig {
  enabled: boolean;
  languages: I18nLanguage[];
  defaultLanguage: string;
}

/**
 * Authoring frame a schema declares for its medium. Picks the right
 * voice and shape so each schema speaks for itself without inheriting
 * course-flavoured defaults:
 * - PEDAGOGICAL (default for course / KB / training): teach, explain,
 *   progressive complexity, assessable.
 * - REFERENCE: terse, scannable, lookup-first; no padding.
 * - EDITORIAL: journalistic / blog / newsletter voice.
 * - NARRATIVE: story, scenes, dialogue, artist-direction visuals.
 * - ANALYTICAL: evidence-grounded analysis. Every claim cites a source
 *   or marks itself synthesized; comparisons are tabular, risks and
 *   costs itemised with explicit assumptions.
 */
export const ContentMode = {
  Pedagogical: 'PEDAGOGICAL',
  Reference: 'REFERENCE',
  Editorial: 'EDITORIAL',
  Narrative: 'NARRATIVE',
  Analytical: 'ANALYTICAL',
} as const;
export type ContentMode = typeof ContentMode[keyof typeof ContentMode];
export const CONTENT_MODES = Object.values(ContentMode);

/**
 * Top-level AI hints declared by the schema.
 */
export interface AiSchemaConfig {
  contentMode?: ContentMode;
}

export interface Schema {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  ai?: AiSchemaConfig;
  meta?: Metadata[];
  defaultMeta?: Record<string, any>;
  structure: ActivityConfig[];
  contentContainers: ContentContainerConfig[];
  collection?: boolean;
  elementMeta?: ElementMetaConfig[];
  i18n?: I18nConfig;
  // @deprecated use elementMeta instead
  tesMeta?: any[];
}

// Ensure metadata symbol is available
import './metadata.shim.js';

import type {
  ActivityRelationship,
  AiActivityConfig,
  EntityRelationshipConfig,
  Metadata,
  Schema,
} from '@tailor-cms/interfaces/schema';
import type { ContentElementType } from '@tailor-cms/content-element-collection/enum.ts';
import type { MetaInputType } from '@tailor-cms/meta-element-collection/enum.ts';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import { ReferenceDeletePolicy } from '@tailor-cms/interfaces/schema';
import { capitalize } from 'lodash-es';

export { ReferenceDeletePolicy };

interface Context {
  name: string;
  metadata: Record<PropertyKey, unknown>;
}

interface PropConfig {
  label?: string;
  required?: boolean;
}

interface ContentElementConfig extends PropConfig {
  isGradable?: boolean;
}

export function Prop(config?: PropConfig) {
  return (_target: any, context: Context) => {
    const meta = context.metadata || {};
    const propMeta = meta[context.name] || {};
    meta[context.name] = {
      key: context.name,
      label: capitalize(context.name),
      required: false,
      ...config,
      ...propMeta,
    };
  };
}

export function IsContentElement(
  type: ContentElementType,
  config?: ContentElementConfig,
) {
  return (_: any, context: Context) => {
    const meta = context.metadata || {};
    const propMeta = meta[context.name] || {};
    meta[context.name] = { ...propMeta, ...config, type, isContentElement: true };
  };
}

export function IsInput(
  type: MetaInputType,
  config?: Omit<Metadata, 'key' | 'type' | 'label'>,
) {
  return (_: any, context: Context) => {
    const meta = context.metadata || {};
    const propMeta = meta[context.name] || {};
    meta[context.name] = { ...propMeta, ...config, type, IsInput: true };
  };
}

/**
 * Reference one or more items of a different entity within the same
 * collection repository.
 */
export function IsRelationship(config: EntityRelationshipConfig) {
  return (_: any, context: Context) => {
    const meta = context.metadata || {};
    const propMeta = meta[context.name] || {};
    meta[context.name] = {
      ...propMeta,
      type: 'RELATIONSHIP',
      isRelationship: true,
      relationship: { ...config },
    };
  };
}

/**
 * Maps a relationship prop to an ActivityRelationship on  activity, so
 * collection relationships reuse the standard refs storage, picker, validation
 * and publishing.
 */
function toActivityRelationship(prop: any): ActivityRelationship {
  const { entity, multiple, allowEmpty, allowCircularLinks, placeholder, onDelete } =
    prop.relationship;
  const resolvedAllowEmpty = allowEmpty ?? true;
  return {
    type: prop.key,
    label: prop.label,
    placeholder: placeholder ?? 'Click to select',
    multiple: multiple ?? false,
    searchable: true,
    allowEmpty: resolvedAllowEmpty,
    allowCircularLinks: allowCircularLinks ?? false,
    allowInsideLineage: true,
    allowedTypes: [entity],
    onDelete:
      onDelete ??
      (resolvedAllowEmpty
        ? ReferenceDeletePolicy.SetNull
        : ReferenceDeletePolicy.Restrict),
  };
}

interface EntityConfig {
  // Unprefixed activity type acting as this entity's identity, e.g. 'WORKSHOP'.
  type: string;
  label?: string;
  // mdi icon shown in the entity chip filter and on list rows.
  icon?: string;
  // Hex color accent for this entity's items.
  color?: string;
  embedElementConfig?: ContentElementType[];
  ai?: AiActivityConfig;
  isTrackedInWorkflow?: boolean;
}

/**
 * A single entity within a collection schema. Compose one or
 * more into a `TailorCollection`.
 */
export class TailorEntity {
  type: string;
  label: string;
  icon?: string;
  color: string;
  props: Array<any>;
  ai?: AiActivityConfig;
  isTrackedInWorkflow: boolean;
  embedElementConfig?: ContentElementType[];

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    entity: Function,
    config: EntityConfig,
  ) {
    const meta = entity[Symbol.metadata] || ({} as Record<PropertyKey, any>);
    this.type = config.type;
    this.label = config.label || capitalize(entity.name);
    this.icon = config.icon;
    this.color = config.color || '#5187C7';
    this.props = Object.entries(meta).map(([key, val]) => ({ key, ...val }));
    this.embedElementConfig = config.embedElementConfig;
    this.ai = config.ai;
    this.isTrackedInWorkflow = config.isTrackedInWorkflow ?? true;
  }
}

interface CollectionConfig {
  id: string;
  name?: string;
  description?: string;
  // Id of a registered workflow; falls back to the default workflow.
  workflowId?: string;
  entities: TailorEntity[];
  meta?: Metadata[];
}

/**
 * A flat ("collection") schema aggregating one or more entities. Each
 * entity becomes a root-level activity type plus its own COLLECTION_ITEM_CONTENT
 * container, so a single repository can hold several distinct, entity types
 * that reference each other.
 */
export class TailorCollection {
  constructor(private config: CollectionConfig) {}

  toSchema(): Schema {
    const { id, name, description, workflowId, entities, meta } = this.config;
    return {
      id,
      collection: true,
      name: name || capitalize(id),
      description: description || `A curated ${name || capitalize(id)} collection.`,
      workflowId: workflowId || 'DEFAULT_WORKFLOW',
      ...(meta && { meta }),
      structure: entities.map((entity) => {
        const relationships = entity.props
          .filter((prop) => prop.isRelationship)
          .map(toActivityRelationship);
        return {
          type: entity.type,
          label: entity.label,
          ...(entity.icon && { icon: entity.icon }),
          color: entity.color,
          rootLevel: true,
          isTrackedInWorkflow: entity.isTrackedInWorkflow,
          contentContainers: [`${entity.type}_CONTENT`],
          ...(relationships.length && { relationships }),
          ...(entity.ai && { ai: entity.ai }),
        };
      }),
      contentContainers: entities.map((entity) => ({
        templateId: ContentContainerType.CollectionItemContent,
        type: `${entity.type}_CONTENT`,
        label: entity.label,
        config: entity.props.filter((prop) => !prop.isRelationship),
        ...(entity.embedElementConfig && {
          embedElementConfig: entity.embedElementConfig,
        }),
        ...(entity.ai && { ai: entity.ai }),
      })),
    };
  }
}

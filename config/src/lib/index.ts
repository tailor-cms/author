// Ensure metadata symbol is available
import './metadata.shim.js';

import type { Metadata, OutlineStyle } from '@tailor-cms/interfaces/schema';
import type { ContentElementType } from '@tailor-cms/content-element-collection/enum.ts';
import { ContentContainerType } from '@tailor-cms/content-container-collection/types.js';
import type { MetaInputType } from '@tailor-cms/meta-element-collection/enum.ts';
import { capitalize } from 'lodash-es';

interface Context {
  name: string;
  metadata: Record<PropertyKey, unknown>;
}

interface PropConfig {
  label?: string;
  required?: boolean;
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

export function IsContentElement(type: ContentElementType) {
  return (_: any, context: Context) => {
    const meta = context.metadata || {};
    const propMeta = meta[context.name] || {};
    meta[context.name] = { ...propMeta, type, isContentElement: true };
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

export class TailorCollection {
  id: string;
  label: string;
  props: Array<any>;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    entity: Function,
    config?: { schemaId?: string; label?: string },
  ) {
    const { schemaId, label } = config || {};
    this.id = schemaId || entity.name.toUpperCase();
    this.label = label || capitalize(entity.name);
    const meta = entity[Symbol.metadata] || {} as Record<PropertyKey, any>;
    this.props = Object.entries(meta).map(([key, val]) => ({ key, ...val }));
  }

  toSchema() {
    return {
      id: this.id,
      name: `${this.label} Collection`,
      outlineStyle: 'GRID' as OutlineStyle,
      workflowId: 'DEFAULT_WORKFLOW',
      contentContainers: [
        {
          type: ContentContainerType.CollectionItemContent,
          templateId: ContentContainerType.CollectionItemContent,
          label: this.label,
          config: this.props,
        },
      ],
      structure: [
        {
          type: `${this.id}_ENTRY`,
          label: this.label,
          rootLevel: true,
          isTrackedInWorkflow: true,
          color: '#5187C7',
          contentContainers: [ContentContainerType.CollectionItemContent],
        },
      ],
    };
  }
}

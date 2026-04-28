// Ensure metadata symbol is available
import './metadata.shim.js';

import type { Metadata } from '@tailor-cms/interfaces/schema';
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

export class TailorCollection {
  id: string;
  label: string;
  props: Array<any>;
  embedElementConfig?: ContentElementType[];
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    entity: Function,
    config?: {
      schemaId?: string;
      label?: string;
      embedElementConfig?: ContentElementType[];
    },
  ) {
    const { schemaId, label, embedElementConfig } = config || {};
    this.id = schemaId || entity.name.toUpperCase();
    this.label = label || capitalize(entity.name);
    this.embedElementConfig = embedElementConfig;
    const meta = entity[Symbol.metadata] || {} as Record<PropertyKey, any>;
    this.props = Object.entries(meta).map(([key, val]) => ({ key, ...val }));
  }

  toSchema() {
    const { id, label, props: config, embedElementConfig } = this;
    return {
      id,
      name: `${label} Collection`,
      description: `A currated ${label} collection.`,
      collection: true,
      workflowId: 'DEFAULT_WORKFLOW',
      contentContainers: [
        {
          type: ContentContainerType.CollectionItemContent,
          templateId: ContentContainerType.CollectionItemContent,
          label,
          config,
          ...(embedElementConfig && { embedElementConfig }),
        },
      ],
      structure: [
        {
          type: `${id}_ENTRY`,
          label,
          rootLevel: true,
          isTrackedInWorkflow: true,
          color: '#5187C7',
          contentContainers: [ContentContainerType.CollectionItemContent],
        },
      ],
    };
  }
}

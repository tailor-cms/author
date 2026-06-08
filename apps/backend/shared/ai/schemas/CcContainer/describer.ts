import type { ContainerStructure } from '@tailor-cms/interfaces/schema';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { processElementConfig, schema as schemaAPI } from '@tailor-cms/config';
import type { ContainerShape } from './types.ts';
import containerRegistry from '../../../content-plugins/containerRegistry.js';

const api = schemaAPI as any;

// Fallback element-type list
const ALL_ELEMENT_TYPES = Object.values(ContentElementType);

export type ShapeDescriptor =
  | {
    shape: Extract<ContainerShape, 'nested'>;
    subcontainers: {
      type: string;
      elementTypes: string[];
      metaKeys: string[];
    }[];
  }
  | {
    shape: Extract<ContainerShape, 'flat'>;
    elementTypes: string[];
    metaKeys: string[];
  }
  | { shape: Extract<ContainerShape, 'props'>; metaKeys: string[] };

export function describeContainerSchema(
  schemaId: string,
  containerType: string,
): ContainerStructure {
  const containerConfig = api.getContainerConfig(schemaId, containerType);
  if (!containerConfig) return { subcontainers: [] };
  const structure = containerRegistry.describeSchema(
    containerConfig,
  ) as ContainerStructure;
  const inheritedElementConfig =
    containerConfig.contentElementConfig || ALL_ELEMENT_TYPES;
  if (structure.subcontainers?.length) {
    for (const subcontainer of structure.subcontainers) {
      if (!subcontainer.elementConfig?.length) {
        subcontainer.elementConfig = inheritedElementConfig;
      }
      subcontainer.elementConfig = processElementConfig(
        cloneElementConfig(subcontainer.elementConfig || []),
      );
    }
  }
  if (structure.elementConfig) {
    structure.elementConfig = processElementConfig(
      cloneElementConfig(structure.elementConfig),
    );
  }
  return structure;
}

/**
 * LLM-facing projection of a container's shape. Surfaces per-
 * subcontainer elementTypes + metaKeys (nested), the container's
 * elementTypes + metaKeys (flat), or just metaKeys (props). The
 * agent's generate_container_content tool returns this so the
 * model can pick item.type and data shape correctly.
 */
export function describeShape(
  schemaId: string,
  containerType: string,
): ShapeDescriptor {
  const structure = describeContainerSchema(schemaId, containerType);
  const containerConfig = api.getContainerConfig(schemaId, containerType);
  if (structure.props?.length) {
    return {
      shape: 'props',
      metaKeys: structure.props.map((prop) => prop.key),
    };
  }
  const subcontainers = structure.subcontainers || [];
  if (subcontainers.length) {
    return {
      shape: 'nested',
      subcontainers: subcontainers.map((subcontainer) => ({
        type: subcontainer.type,
        elementTypes: api.getSupportedElementTypes(
          subcontainer.elementConfig || [],
        ),
        metaKeys: (subcontainer.meta || []).map((meta: any) => meta.key),
      })),
    };
  }
  return {
    shape: 'flat',
    elementTypes: api.getSupportedElementTypes(structure.elementConfig || []),
    metaKeys: containerConfig?.multiple ? ['name'] : [],
  };
}

// Shallow-clone element config so processElementConfig doesn't
// mutate shared schema references.
function cloneElementConfig(config: any[]): any[] {
  return config.map((it: any) => {
    if (typeof it === 'string') return it;
    return {
      ...it,
      ...(it.items && { items: [...it.items] }),
    };
  });
}

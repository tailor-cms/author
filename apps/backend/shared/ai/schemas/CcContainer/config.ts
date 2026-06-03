// Shape detection + per-shape parsing for the CcContainer spec.
import type {
  ContainerStructure,
  ContentContainerConfig,
} from '@tailor-cms/interfaces/schema';
import type {
  FlatConfig,
  NestedConfig,
  ParsedConfig,
  PropsConfig,
} from './types.ts';
import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import containerRegistry from '../../../content-plugins/containerRegistry.js';
import { schema as schemaAPI } from '@tailor-cms/config';
import { oneLine } from 'common-tags';

/**
 * Resolve the active container and dispatch parsing by shape.
 * Detection key (from describeSchema):
 *  - props array        -> 'props'  (COLLECTION style)
 *  - subcontainers      -> 'nested' (STRUCTURED_CONTENT, EXAM)
 *  - elementConfig      -> 'flat'   (DEFAULT, ASSESSMENT_POOL,
 *                                    any custom flat templates)
 * Throws when the container can't be resolved or shape can't be
 * detected - AiPrompt's outer catch will log + bubble out as an
 * empty agent result rather than silently produce junk.
 */
export const getConfigs = (context: AiContext): ParsedConfig => {
  const { outlineActivityType, containerType } = context.repository;
  if (!outlineActivityType || !containerType) {
    throw new Error(oneLine`
      CcContainer.getConfigs: missing outlineActivityType
      or containerType in context.repository.
    `);
  }
  const containers = schemaAPI.getSupportedContainers(outlineActivityType);
  const container = containers.find(
    (c: ContentContainerConfig) => c.type === containerType,
  );
  if (!container) {
    throw new Error(oneLine`
      CcContainer.getConfigs: container "${containerType}" is not
      a supported container for "${outlineActivityType}".
    `);
  }
  const desc = containerRegistry.describeSchema(container) as ContainerStructure;
  if (desc.props?.length) return parseProps(container, desc);
  if (desc.subcontainers?.length) return parseNested(container, desc);
  if (desc.elementConfig) return parseFlat(container, desc);
  throw new Error(oneLine`
    CcContainer.getConfigs: cannot detect shape for "${containerType}";
    describeSchema returned no subcontainers, elementConfig, or props.
  `);
};

// Pass-through of raw describer output
function parseNested(
  container: ContentContainerConfig,
  desc: ContainerStructure,
): NestedConfig {
  return {
    shape: 'nested',
    container,
    subcontainers: desc.subcontainers || [],
    defaultSubcontainers: desc.defaultSubcontainers || [],
  };
}

// Pass-through for flat containers
function parseFlat(
  container: ContentContainerConfig,
  desc: ContainerStructure,
): FlatConfig {
  return {
    shape: 'flat',
    container,
    elementTypes: schemaAPI.getSupportedElementTypes(desc.elementConfig || []),
  };
}

// Pass-through for collection items
function parseProps(
  container: ContentContainerConfig,
  desc: ContainerStructure,
): PropsConfig {
  return {
    shape: 'props',
    container,
    props: desc.props || [],
  };
}

import type {
  CollectionProp,
  ContentContainerConfig,
  ContentSubcontainer,
} from '@tailor-cms/interfaces/schema';

// Three orthogonal shapes a container template can take. Detected
// from describeSchema's output via getConfigs, drives the Schema /
// getPrompt / processResponse dispatch.
//   nested - subcontainers under a wrapper (STRUCTURED_CONTENT, EXAM)
//   flat   - direct content elements, optionally multi-instance
//            (DEFAULT, ASSESSMENT_POOL, custom multi-instance containers)
//   props  - named typed slots inside container.data
//            (COLLECTION_ITEM_CONTENT)
export type ContainerShape = 'nested' | 'flat' | 'props';

// Common base across shape variants. Every parsed config holds a
// reference to its source ContentContainerConfig so consumers read
// container.type / container.label / container.multiple / container.ai
// from a single source instead of denormalising those fields onto
// each variant.
interface BaseConfig {
  container: ContentContainerConfig;
}

export interface NestedConfig extends BaseConfig {
  shape: 'nested';
  subcontainers: ContentSubcontainer[];
  defaultSubcontainers: { type: string; data?: Record<string, unknown> }[];
}

export interface FlatConfig extends BaseConfig {
  shape: 'flat';
  // Resolved list of allowed element type ids - flattened from the
  // raw elementConfig (groups + items + strings) into the form the
  // schema / prompt builders consume.
  elementTypes: string[];
}

export interface PropsConfig extends BaseConfig {
  shape: 'props';
  // Pass-through of describer's props array (CollectionProp shape is
  // already the right form for consumption).
  props: CollectionProp[];
}

export type ParsedConfig = NestedConfig | FlatConfig | PropsConfig;

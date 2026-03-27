// Container config resolution.
// Parses schema config into per-subcontainer configs
// with element types and metadata field schemas.
import {
  getSchema as getMetaInputSchema,
} from '@tailor-cms/meta-element-collection/schema.js';
import { schema as schemaAPI } from '@tailor-cms/config';
import type { AiContext } from '@tailor-cms/interfaces/ai.ts';

import type {
  MetaField,
  ParsedConfig,
  SubcontainerConfigs,
} from './types.ts';

const { flattenElementTypeIds } = schemaAPI;

const getMetaDefinitions = (val: any): any[] =>
  typeof val.meta === 'function'
    ? val.meta()
    : val.meta || [];

const toMetaFields = (meta: any[]): MetaField[] =>
  meta.map((m: any) => ({
    key: m.key,
    label: m.label,
    schema: getMetaInputSchema(m.type, m),
    ...((m.options || m.items) && {
      options: m.options || m.items,
    }),
  }));

export const getConfigs = (context: AiContext): ParsedConfig => {
  const empty: ParsedConfig = { subcontainers: {} };
  const { repository } = context;
  const { outlineActivityType, containerType } = repository;
  if (!outlineActivityType || !containerType) return empty;
  const containers = schemaAPI.getSupportedContainers(
    outlineActivityType,
  );
  const container = containers.find((c: any) => c.type === containerType);
  if (!container?.config) return empty;
  const defaultTypes = flattenElementTypeIds(container.contentElementConfig);
  const subcontainers: SubcontainerConfigs = {};
  for (const [type, val] of Object.entries(
    container.config as Record<string, any>,
  )) {
    const elementTypes = val.contentElementConfig
      ? flattenElementTypeIds(val.contentElementConfig)
      : defaultTypes;
    subcontainers[type] = {
      label: val.label || type,
      elementTypes,
      metaInputs: toMetaFields(getMetaDefinitions(val)),
    };
  }
  return { subcontainers, ai: container.ai };
};

// Subcontainer parsing via containerRegistry.describeSchema
// (resolves function-form meta/elementConfig, surfaces
// defaultSubcontainers). Container-level elementConfig
// fallback and ai are read directly.
import {
  getSchema as getMetaInputSchema,
} from '@tailor-cms/meta-element-collection/schema.js';
import { schema as schemaAPI } from '@tailor-cms/config';
import type { AiContext } from '@tailor-cms/interfaces/ai.ts';

import containerRegistry from '../../../content-plugins/containerRegistry.js';
import type {
  MetaField,
  ParsedConfig,
  SubcontainerConfigs,
} from './types.ts';

const { getSupportedElementTypes } = schemaAPI;

const toMetaFields = (meta: any[]): MetaField[] =>
  meta.map((m: any) => ({
    key: m.key,
    label: m.label,
    schema: getMetaInputSchema(m.type, m),
    ...((m.options || m.items) && {
      options: m.options || m.items,
    }),
  }));

const EMPTY_CONFIG: ParsedConfig = {
  subcontainers: {},
  defaultSubcontainers: [],
};

export const getConfigs = (context: AiContext): ParsedConfig => {
  const { outlineActivityType, containerType } = context.repository;
  if (!outlineActivityType || !containerType) return EMPTY_CONFIG;
  const containers = schemaAPI.getSupportedContainers(outlineActivityType);
  const container = containers.find((c: any) => c.type === containerType);
  if (!container) return EMPTY_CONFIG;
  const {
    subcontainers: subDefs = [],
    defaultSubcontainers = [],
  } = containerRegistry.describeSchema(container);
  const defaultElementTypes = getSupportedElementTypes(
    container.contentElementConfig,
  );
  const subcontainers: SubcontainerConfigs = {};
  for (const sub of subDefs) {
    const elementTypes = sub.elementConfig?.length
      ? getSupportedElementTypes(sub.elementConfig)
      : defaultElementTypes;
    subcontainers[sub.type] = {
      label: sub.label,
      elementTypes,
      metaInputs: toMetaFields(sub.meta || []),
    };
  }
  return {
    subcontainers,
    defaultSubcontainers,
    ai: container.ai,
  };
};

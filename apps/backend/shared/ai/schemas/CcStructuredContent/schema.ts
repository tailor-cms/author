// OpenAI structured output JSON schema builder.
// Builds a JSON Schema with subcontainer types, element types,
// metadata fields, and optional media element types.
import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import type { OpenAISchema } from '../interfaces.ts';

import { createLogger } from '#logger';
import { HTML_TYPE } from '../CeHtml.ts';
import elementRegistry from '../../../content-plugins/elementRegistry.js';
import { getConfigs } from './config.ts';
import { MEDIA_SCHEMAS } from './media.ts';
import type { SubcontainerConfig } from './types.ts';

const logger = createLogger('ai:structured-content');

const getAiSpec = (type: string) =>
  elementRegistry.getAiConfig(type);

const obj = (properties: any, required: string[]) => ({
  type: 'object' as const,
  properties,
  ...(required.length && { required }),
  additionalProperties: false,
});

const resolveSupportedTypes = (
  types: string[],
): string[] => {
  const supported = types.filter(
    (t) => getAiSpec(t)?.Schema,
  );
  return supported.length ? supported : [HTML_TYPE];
};

export { getAiSpec, resolveSupportedTypes };

const buildElementSchema = (type: string) => {
  const contentSchema = getAiSpec(type).Schema.schema;
  return obj(
    { type: { enum: [type] }, ...contentSchema.properties },
    ['type', ...(contentSchema.required || [])],
  );
};

const getElementsSchema = (
  types: string[],
  hasAssets = false,
) => {
  const resolved = resolveSupportedTypes(types);
  const schemas = resolved.map(buildElementSchema);
  if (hasAssets) {
    const { Image, Video, Embed } = ContentElementType;
    for (const type of [Image, Video, Embed]) {
      if (!resolved.includes(type) && MEDIA_SCHEMAS[type]) {
        schemas.push(MEDIA_SCHEMAS[type]);
      }
    }
  }
  const items = schemas.length === 1
    ? schemas[0]
    : { anyOf: schemas };
  return { type: 'array', items };
};

const buildSubcontainerSchema = (
  type: string,
  config: SubcontainerConfig,
  hasAssets = false,
) => {
  const { metaInputs, elementTypes } = config;
  const props: Record<string, any> = {
    type: { enum: [type] },
    elements: getElementsSchema(elementTypes, hasAssets),
  };
  const required = ['type', 'elements'];
  const dataProps: Record<string, any> = {};
  const dataRequired: string[] = [];
  for (const field of metaInputs) {
    if (!field.schema) continue;
    const values = field.options?.map((o) => o.value);
    dataProps[field.key] = values?.length
      ? { ...field.schema, enum: values }
      : field.schema;
    dataRequired.push(field.key);
  }
  if (Object.keys(dataProps).length) {
    props.data = obj(dataProps, dataRequired);
    required.push('data');
  }
  return obj(props, required);
};

export const Schema = (
  context: AiContext,
): OpenAISchema => {
  const { subcontainers } = getConfigs(context);
  const hasAssets = !!context.assets?.length;
  logger.info({
    hasAssets,
    assetCount: context.assets?.length ?? 0,
    hasVectorStore: !!context.repository.vectorStoreId,
    subcontainerTypes: Object.keys(subcontainers),
  }, 'Building schema');
  const entries = Object.entries(subcontainers);
  if (!entries.length) {
    entries.push(['SECTION', {
      label: 'Section',
      metaInputs: [],
      elementTypes: [],
    }]);
  }
  const schemas = entries.map(([type, config]) =>
    buildSubcontainerSchema(type, config, hasAssets),
  );
  const subcontainerSchema = schemas.length === 1
    ? schemas[0]
    : { anyOf: schemas };
  return {
    type: 'json_schema',
    name: 'cc_structured_content',
    schema: obj(
      {
        subcontainers: {
          type: 'array',
          items: subcontainerSchema,
        },
      },
      ['subcontainers'],
    ),
  };
};

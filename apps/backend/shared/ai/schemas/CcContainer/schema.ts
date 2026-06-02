// OpenAI structured output JSON schema builder.
// Builds a JSON Schema with subcontainer types, element types,
// metadata fields, and optional media element types.
import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import type { OpenAISchema } from '../interfaces.ts';

import { HTML_TYPE } from '../CeHtml.ts';
import { createAiLogger } from '../../logger.ts';
import elementRegistry from '../../../content-plugins/elementRegistry.js';
import { getConfigs } from './config.ts';
import { MEDIA_SCHEMAS } from './media.ts';
import type { SubcontainerConfig } from './types.ts';

const logger = createAiLogger('cc-structured-content');

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

export const buildElementSchema = (type: string) => {
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
  defaultData?: Record<string, any>,
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
    // Three cases for how strictly the AI is constrained on this field:
    //   1. Pinned by defaultData
    //      The schema author seeded this field via `defaultSubcontainers`
    //      (e.g. `data: { title: 'Intro' }`). Lock the AI to that exact
    //      value with a single-element `enum` (acts as a JSON Schema
    //      `const`). The AI is allowed to produce only this value.
    //   2. Bounded by a meta-input options list
    //      The meta input declares a fixed option set (e.g. a Select
    //      with EASY/MEDIUM/HARD). Constrain the AI to those values
    //      via `enum`.
    //   3. Free-form
    //      No defaultData and no options - emit the field's own JSON
    //      schema (string/number/etc.) and let the AI fill freely.
    if (defaultData?.[field.key] != null) {
      dataProps[field.key] = {
        ...field.schema,
        enum: [defaultData[field.key]],
      };
    } else {
      const values = field.options?.map((o) => o.value);
      dataProps[field.key] = values?.length
        ? { ...field.schema, enum: values }
        : field.schema;
    }
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
  const { subcontainers, defaultSubcontainers } = getConfigs(context);
  const hasAssets = !!context.assets?.length;
  logger.info({
    hasAssets,
    assetCount: context.assets?.length ?? 0,
    hasVectorStore: !!context.repository.vectorStoreId,
    subcontainerTypes: Object.keys(subcontainers),
    presetCount: defaultSubcontainers.length,
  }, 'Building schema');
  const entries = Object.entries(subcontainers);
  if (!entries.length) {
    entries.push(['SECTION', {
      label: 'Section',
      metaInputs: [],
      elementTypes: [],
    }]);
  }
  let subcontainersSchema: Record<string, any>;
  if (defaultSubcontainers.length) {
    // Preset mode: build one pinned schema per seeded subcontainer.
    // Each seed locks its data fields (e.g. title) via enum, and
    // minItems/maxItems clamp the array length so the AI cannot
    // add, drop, or reorder beyond the union of pinned shapes.
    const configByType = Object.fromEntries(entries);
    const presetSchemas = defaultSubcontainers.map((defaultSub) => {
      const config = configByType[defaultSub.type] || entries[0][1];
      return buildSubcontainerSchema(
        defaultSub.type, config, hasAssets, defaultSub.data,
      );
    });
    const itemSchema = presetSchemas.length === 1
      ? presetSchemas[0]
      : { anyOf: presetSchemas };
    subcontainersSchema = {
      type: 'array',
      items: itemSchema,
      minItems: presetSchemas.length,
      maxItems: presetSchemas.length,
    };
  } else {
    const schemas = entries.map(([type, config]) =>
      buildSubcontainerSchema(type, config, hasAssets),
    );
    const itemSchema = schemas.length === 1
      ? schemas[0]
      : { anyOf: schemas };
    subcontainersSchema = { type: 'array', items: itemSchema };
  }
  return {
    type: 'json_schema',
    name: 'cc_structured_content',
    schema: obj(
      { subcontainers: subcontainersSchema },
      ['subcontainers'],
    ),
  };
};

// OpenAI structured-output JSON schema builder for Content Containers.
import {
  getSchema as getMetaInputSchema,
} from '@tailor-cms/meta-element-collection/schema.js';
import { oneLine } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import type { ContentSubcontainer } from '@tailor-cms/interfaces/schema';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';

import type {
  FlatConfig,
  NestedConfig,
  PropsConfig,
} from './types.ts';
import type { AiResponseSpec, OpenAISchema } from '../interfaces.ts';
import { HTML_TYPE } from '../CeHtml.ts';
import { MEDIA_SCHEMAS } from './media.ts';
import { createAiLogger } from '../../logger.ts';
import { getConfigs } from './config.ts';
import elementRegistry from '../../../content-plugins/elementRegistry.js';

const logger = createAiLogger('cc-container');

// Typed accessor for the registry's untyped per-element AI config.
export const getCeAiSpec = (type: string): AiResponseSpec | undefined =>
  elementRegistry.getAiConfig(type) as AiResponseSpec | undefined;

const obj = (properties: any, required: string[]) => ({
  type: 'object' as const,
  properties,
  ...(required.length && { required }),
  additionalProperties: false,
});

export const resolveSupportedTypes = (types: string[]): string[] => {
  const supported = types.filter((t) => getCeAiSpec(t)?.Schema);
  return supported.length ? supported : [HTML_TYPE];
};

export const buildElementSchema = (type: string) => {
  const schemaDef = getCeAiSpec(type)!.Schema as OpenAISchema;
  const contentSchema = schemaDef.schema as any;
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

// Build the JSON schema for one subcontainer
const buildSubcontainerSchema = (
  sub: ContentSubcontainer,
  defaultCeTypes: string[],
  hasAssets = false,
  defaultData?: Record<string, any>,
) => {
  const elementTypes = sub.elementConfig?.length
    ? schemaAPI.getSupportedElementTypes(sub.elementConfig)
    : defaultCeTypes;
  const props: Record<string, any> = {
    type: { enum: [sub.type] },
    elements: getElementsSchema(elementTypes, hasAssets),
  };
  const required = ['type', 'elements'];
  const dataProps: Record<string, any> = {};
  const dataRequired: string[] = [];
  for (const field of sub.meta || []) {
    const fieldSchema = getMetaInputSchema(field.type, field);
    if (!fieldSchema) continue;
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
        ...fieldSchema,
        enum: [defaultData[field.key]],
      };
    } else {
      const fieldOptions = field.options || field.items;
      const values = fieldOptions?.map((o: any) => o.value);
      dataProps[field.key] = values?.length
        ? { ...fieldSchema, enum: values }
        : fieldSchema;
    }
    dataRequired.push(field.key);
  }
  if (Object.keys(dataProps).length) {
    props.data = obj(dataProps, dataRequired);
    required.push('data');
  }
  return obj(props, required);
};

// Top-level entry: dispatches by detected shape. Each builder returns
// an OpenAISchema with a uniform `cc_container` name; structure differs.
export const Schema = (context: AiContext): OpenAISchema => {
  const cfg = getConfigs(context);
  const hasAssets = !!context.assets?.length;
  logger.info({
    shape: cfg.shape,
    containerType: cfg.container.type,
    hasAssets,
    assetCount: context.assets?.length ?? 0,
    hasVectorStore: !!context.repository.vectorStoreId,
  }, 'Building schema');
  switch (cfg.shape) {
    case 'nested': return buildNestedSchema(cfg, hasAssets);
    case 'flat': return buildFlatSchema(cfg, hasAssets);
    case 'props': return buildPropsSchema(cfg, hasAssets);
  }
};

// Nested: items[] of subcontainers, each with its meta + elements.
function buildNestedSchema(
  cfg: NestedConfig,
  hasAssets: boolean,
): OpenAISchema {
  if (!cfg.subcontainers.length) {
    throw new Error(oneLine`
      CcContainer.Schema (nested): no subcontainers declared
      for "${cfg.container.type}"
    `);
  }
  const defaultCeTypes = schemaAPI.getSupportedElementTypes(
    cfg.container.contentElementConfig || [],
  );
  let subcontainersSchema: Record<string, any>;
  if (cfg.defaultSubcontainers.length) {
    // Preset mode: build one pinned schema per seeded subcontainer.
    // Each seed locks its data fields (e.g. title) via enum, and
    // minItems/maxItems clamp the array length so the AI cannot
    // add, drop, or reorder beyond the union of pinned shapes.
    const presetSchemas = cfg.defaultSubcontainers.map((defaultSub) => {
      const sub = cfg.subcontainers.find((s) => s.type === defaultSub.type)
        ?? cfg.subcontainers[0];
      return buildSubcontainerSchema(
        sub, defaultCeTypes, hasAssets, defaultSub.data,
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
    const schemas = cfg.subcontainers.map((sub) =>
      buildSubcontainerSchema(sub, defaultCeTypes, hasAssets),
    );
    const itemSchema = schemas.length === 1
      ? schemas[0]
      : { anyOf: schemas };
    subcontainersSchema = { type: 'array', items: itemSchema };
  }
  return {
    type: 'json_schema',
    name: 'cc_container',
    schema: obj(
      { subcontainers: subcontainersSchema },
      ['subcontainers'],
    ),
  };
}

// Flat: items[] of containers, each carrying elements directly.
// multiple:true allows N siblings; multiple unset pins to exactly one.
// data field is empty by default - flat containers don't declare
// per-instance meta at the ContentContainerConfig level today.
function buildFlatSchema(
  cfg: FlatConfig,
  hasAssets: boolean,
): OpenAISchema {
  const itemSchema = obj({
    type: { enum: [cfg.container.type] },
    elements: getElementsSchema(cfg.elementTypes, hasAssets),
  }, ['type', 'elements']);
  const itemsSchema: Record<string, any> = {
    type: 'array',
    items: itemSchema,
  };
  if (!cfg.container.multiple) {
    itemsSchema.minItems = 1;
    itemsSchema.maxItems = 1;
  }
  return {
    type: 'json_schema',
    name: 'cc_container',
    schema: obj({ items: itemsSchema }, ['items']),
  };
}

// Props: { data: { [propKey]: <value-or-element-content> } }.
// Element-typed props use the element's own AI content schema
// (without the {type} wrapper - the prop key already pins the type);
// meta-typed props use the meta-input JSON schema. Required by
// default unless prop.required === false.
function buildPropsSchema(
  cfg: PropsConfig,
  _hasAssets: boolean,
): OpenAISchema {
  const dataProps: Record<string, any> = {};
  const required: string[] = [];
  for (const p of cfg.props) {
    let propSchema: any;
    if (p.isContentElement) {
      const schemaDef = getCeAiSpec(p.type)?.Schema as OpenAISchema | undefined;
      if (!schemaDef?.schema) continue;
      const contentSchema = schemaDef.schema as any;
      propSchema = obj(
        contentSchema.properties || {},
        contentSchema.required || [],
      );
    } else {
      const metaSchema = getMetaInputSchema(p.type, p);
      if (!metaSchema) continue;
      propSchema = metaSchema;
    }
    dataProps[p.key] = propSchema;
    if (p.required !== false) required.push(p.key);
  }
  if (!Object.keys(dataProps).length) {
    throw new Error(oneLine`
      CcContainer.Schema (props): no usable prop schemas resolved
      for "${cfg.container.type}"
    `);
  }
  return {
    type: 'json_schema',
    name: 'cc_container',
    schema: obj({ data: obj(dataProps, required) }, ['data']),
  };
}

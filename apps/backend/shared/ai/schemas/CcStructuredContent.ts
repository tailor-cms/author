import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import type { Activity } from '@tailor-cms/interfaces/activity.ts';
import {
  getSchema as getMetaInputSchema,
} from '@tailor-cms/meta-element-collection/schema.js';
import { schema as schemaAPI } from '@tailor-cms/config';

import type { AiResponseSpec, OpenAISchema } from './interfaces.ts';
import { HTML_TYPE } from './CeHtml.ts';
import elementRegistry from '../../content-plugins/elementRegistry.js';

// Resolve AI config (Schema + processResponse) for an element type.
const getAiSpec = (type: string) => elementRegistry.getAiConfig(type);

// Filter to element types with AI support, fall back to HTML.
const resolveSupportedTypes = (types: string[]): string[] => {
  const supported = types.filter((t) => getAiSpec(t)?.Schema);
  return supported.length ? supported : [HTML_TYPE];
};

interface MetaField {
  key: string;
  label: string;
  // JSON Schema inferred from meta-input manifest at runtime.
  // e.g. { type: 'string' }, { type: 'array', items: { type: 'number' } }
  // null when meta-input has no schema (e.g. FILE) - excluded from AI output.
  schema: { type: string; items?: { type: string } } | null;
  options?: { value: string | number; label: string }[];
}

interface SubcontainerConfig {
  label: string;
  metaInputs: MetaField[];
  elementTypes: string[];
}
type SubcontainerConfigs = Record<string, SubcontainerConfig>;

interface ParsedConfig {
  subcontainers: SubcontainerConfigs;
  defaultSubcontainers: Pick<Activity, 'type' | 'data'>[];
  ai?: {
    definition?: string;
    outputRules?: { prompt?: string };
  };
}

const obj = (properties: any, required: string[]) => ({
  type: 'object' as const,
  properties,
  ...(required.length && { required }),
  additionalProperties: false,
});

// Server packages export raw content schemas (e.g. { content: 'string' } for HTML).
// Wrap into full element format with type discriminator and data envelope.
const buildElementSchema = (type: string) => {
  const contentSchema = getAiSpec(type).Schema.schema;
  return {
    type: 'object' as const,
    properties: {
      type: { enum: [type] },
      ...contentSchema.properties,
    },
    required: ['type', ...(contentSchema.required || [])],
    additionalProperties: false,
  };
};

const getElementsSchema = (types: string[]) => {
  const resolved = resolveSupportedTypes(types);
  const schemas = resolved.map(buildElementSchema);
  const items = schemas.length === 1 ? schemas[0] : { anyOf: schemas };
  return { type: 'array', items };
};

// Processed contentElementConfig format:
// [{ name: 'Group', items: [{ id: 'TYPE' }] }]
const getElementTypeIds = (config?: any[]): string[] =>
  config?.flatMap((group: any) =>
    (group.items || []).map((it: any) => it.id || it),
  ) ?? [];

// Subcontainer meta can be a static array or a factory fn.
// e.g. meta: () => [{ key: 'title', type: 'TEXT_FIELD' }]
const getMetaDefinitions = (val: any): any[] =>
  typeof val.meta === 'function'
    ? val.meta()
    : val.meta || [];

// Map raw meta definitions to MetaField with resolved schema.
// Options come from m.options (select) or m.items (radio).
const toMetaFields = (meta: any[]): MetaField[] =>
  meta.map((m: any) => ({
    key: m.key,
    label: m.label,
    schema: getMetaInputSchema(m.type, m),
    ...((m.options || m.items) && {
      options: m.options || m.items,
    }),
  }));

// Container-level options – not subcontainer type definitions.
const CONTAINER_OPTIONS = [
  'isCollapsible',
  'collapsedPreviewKey',
  'defaultSubcontainers',
];

const EMPTY_CONFIG: ParsedConfig = {
  subcontainers: {},
  defaultSubcontainers: [],
};

// Parse container schema config into per-subcontainer configs.
// Resolves element types and meta field schemas for each
// subcontainer type defined in the container config.
const getConfigs = (context: AiContext): ParsedConfig => {
  const { outlineActivityType, containerType } =
    context.repository;
  if (!outlineActivityType || !containerType) return EMPTY_CONFIG;
  const containers = schemaAPI.getSupportedContainers(
    outlineActivityType,
  );
  const container = containers.find(
    (c: any) => c.type === containerType,
  );
  if (!container?.config) return EMPTY_CONFIG;
  // Container-level element types as default fallback
  const defaultElementTypes = getElementTypeIds(
    container.contentElementConfig,
  );
  const subcontainers: SubcontainerConfigs = {};
  for (const [type, val] of Object.entries(
    container.config as Record<string, any>,
  )) {
    if (CONTAINER_OPTIONS.includes(type)) continue;
    // Subcontainer config overrides container-level
    const elementTypes = val.contentElementConfig
      ? getElementTypeIds(val.contentElementConfig)
      : defaultElementTypes;
    subcontainers[type] = {
      label: val.label || type,
      elementTypes,
      metaInputs: toMetaFields(getMetaDefinitions(val)),
    };
  }
  return {
    subcontainers,
    defaultSubcontainers:
      container.config.defaultSubcontainers || [],
    ai: container.ai,
  };
};

// Build JSON schema for a single subcontainer type:
// discriminated by type enum, with per-type elements and data.
// When defaultData is provided, matching meta fields are
// pinned to exact values via JSON Schema `const`.
const buildSubcontainerSchema = (
  type: string,
  config: SubcontainerConfig,
  defaultData?: Record<string, any>,
) => {
  const { metaInputs, elementTypes } = config;
  const props: Record<string, any> = {
    type: { enum: [type] },
    elements: getElementsSchema(elementTypes),
  };
  const required = ['type', 'elements'];
  const dataProps: Record<string, any> = {};
  const dataRequired: string[] = [];
  for (const field of metaInputs) {
    if (!field.schema) continue;
    if (defaultData?.[field.key] != null) {
      dataProps[field.key] = { ...field.schema, enum: [defaultData[field.key]] };
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

// Build OpenAI structured output schema from container config.
// Each subcontainer type becomes a discriminated union variant
// with its own allowed element types and metadata fields.
// When defaultSubcontainers are defined, uses a tuple to
// enforce exact count, types, and data at each position.
export const Schema = (context: AiContext): OpenAISchema => {
  const {
    subcontainers, defaultSubcontainers,
  } = getConfigs(context);
  // Default to generic section when no config is defined
  const entries = Object.entries(subcontainers);
  if (!entries.length) {
    entries.push(['SECTION', {
      label: 'Section', metaInputs: [], elementTypes: [],
    }]);
  }
  const configByType = Object.fromEntries(entries);
  let subcontainersSchema: Record<string, any>;
  if (defaultSubcontainers.length) {
    const schemas = defaultSubcontainers.map((defaultSub) => {
      const config =
        configByType[defaultSub.type] || entries[0][1];
      return buildSubcontainerSchema(
        defaultSub.type, config, defaultSub.data,
      );
    });
    const itemSchema = schemas.length === 1
      ? schemas[0]
      : { anyOf: schemas };
    subcontainersSchema = {
      type: 'array',
      items: itemSchema,
      minItems: schemas.length,
      maxItems: schemas.length,
    };
  } else {
    const schemas = entries.map(([type, config]) =>
      buildSubcontainerSchema(type, config));
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

const describeField = ({ key, label, options }: MetaField): string => {
  const base = `"${key}" (${label})`;
  const opts = options?.map((o) => o.value).join(', ');
  return opts ? `${base} [options: ${opts}]` : base;
};

const describeElementTypes = (types: string[]): string =>
  resolveSupportedTypes(types)
    .map((type) => {
      const prompt = getAiSpec(type)?.getPrompt?.() || '';
      // Extract element description from server package prompt.
      // e.g. "Generate a accordion content element as an object..."
      //   ->  "a accordion content element"
      const match = prompt.match(/generate\s+(.+?)\s+as\s+an/i);
      return `  - "${type}": ${match?.[1] || type}`;
    })
    .join('\n');

const describeSubcontainerTypes = (configs: SubcontainerConfigs): string => {
  const entries = Object.entries(configs);
  if (!entries.length) return '  - Type "SECTION" (Section)';
  return entries
    .map(([type, { label, metaInputs = [] }]) => {
      const fields = metaInputs.map(describeField).join(', ');
      const suffix = fields ? `: metadata fields: ${fields}` : '';
      return `  - Type "${type}" (${label})${suffix}`;
    })
    .join('\n');
};

const describeDefaultSubcontainers = (
  defaults: Pick<Activity, 'type' | 'data'>[],
  configs: SubcontainerConfigs,
): string =>
  defaults
    .map((defaultSub) => {
      const label =
        configs[defaultSub.type]?.label || defaultSub.type;
      const title = defaultSub.data?.title;
      return title
        ? `  - "${title}" (${label})`
        : `  - ${label}`;
    })
    .join('\n');

// Build prompt with available element types, subcontainer types,
// metadata fields, and container-level AI instructions.
export const getPrompt = (context: AiContext) => {
  const { subcontainers, defaultSubcontainers, ai } = getConfigs(context);
  // Collect all unique element types across subcontainers
  const allElementTypes = [
    ...new Set(Object.values(subcontainers).flatMap((c) => c.elementTypes)),
  ];
  const guidelines: string[] = [
    '- Fill in ALL metadata fields with values relevant to each subcontainer\'s content',
    '- Each subcontainer should focus on a distinct topic or aspect',
    '- Choose the best element type for each piece of content',
    '- Skip media elements (images, videos, audio, files)',
    '- Include at most one question element per subcontainer',
  ];
  // Container ai.definition describes the content purpose
  // e.g. "Learning Bit content is organized into sections"
  if (ai?.definition) {
    guidelines.push(`- Context: ${ai.definition}`);
  }
  if (context.repository.vectorStoreId) {
    guidelines.push(
      '- Base ALL content on the provided source documents',
      '- Reference specific information, data, and examples from the documents',
      '- Do not invent information not present in the documents',
    );
  }
  if (defaultSubcontainers.length) {
    guidelines.push(
      '- Generate exactly these subcontainers in order:\n'
      + describeDefaultSubcontainers(
        defaultSubcontainers, subcontainers,
      ),
    );
  }
  if (ai?.outputRules?.prompt) {
    guidelines.push(ai.outputRules.prompt.trim());
  }
  return `
  Response should be a JSON object with a "subcontainers" array.
  Each subcontainer has:
  - "type": one of the available subcontainer types
  - "data": metadata object with the described fields filled in
  - "elements": array of content elements (format defined by the schema)

  Available element types:
  ${describeElementTypes(allElementTypes)}

  Available subcontainer types:
  ${describeSubcontainerTypes(subcontainers)}

  Guidelines:
  ${guidelines.join('\n  ')}`;
};

// AI returns flat elements matching the content schema (e.g. { type, content } for HTML).
// Server processResponse transforms raw content into the element's data format.
const processElement = (el: any) => {
  const { type, ...rawContent } = el;
  const spec = getAiSpec(type);
  const data = spec?.processResponse
    ? spec.processResponse(rawContent)
    : rawContent;
  return { type, data };
};

const processResponse = (data: any = {}) => {
  const subcontainers = data?.subcontainers || [];
  return subcontainers.map((sc: any) => ({
    ...sc,
    elements: (sc.elements || []).map(processElement),
  }));
};

const spec: AiResponseSpec = {
  getPrompt,
  Schema,
  processResponse,
};

export default spec;

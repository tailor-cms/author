import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import {
  getSchema as getMetaInputSchema,
} from '@tailor-cms/meta-element-collection/schema.js';
import { schema as schemaAPI } from '@tailor-cms/config';

import type { AiResponseSpec, OpenAISchema } from './interfaces.ts';
import { HTML_TYPE, ElementSchema } from './CeHtml.ts';
import { QUESTION_TYPE, QuestionElementSchema } from './CeQuestion.ts';

interface MetaField {
  key: string;
  label: string;
  schema: { type: string; items?: { type: string } };
  options?: { value: string; label: string }[];
}

interface SubcontainerConfig {
  label: string;
  metaInputs: MetaField[];
  elementTypes?: string[];
}

type SubcontainerConfigs = Record<string, SubcontainerConfig>;

const ELEMENT_SCHEMAS: Record<string, any> = {
  [HTML_TYPE]: ElementSchema,
  [QUESTION_TYPE]: QuestionElementSchema,
};

const getElementsSchema = (types?: string[]) => {
  const schemas = (types || [HTML_TYPE])
    .map((t) => ELEMENT_SCHEMAS[t])
    .filter(Boolean);
  const items = schemas.length === 1 ? schemas[0] : { anyOf: schemas };
  return { type: 'array', items };
};

const obj = (properties: any, required: string[]) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});

const buildDataSchema = (configs: SubcontainerConfigs) => {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  for (const { metaInputs = [] } of Object.values(configs)) {
    for (const field of metaInputs) {
      if (properties[field.key]) continue;
      properties[field.key] = field.schema;
      required.push(field.key);
    }
  }
  return obj(properties, required);
};

const getConfigs = (context: AiContext): SubcontainerConfigs => {
  const { outlineActivityType, containerType } = context.repository;
  if (!outlineActivityType || !containerType) return {};
  const containers = schemaAPI.getSupportedContainers(outlineActivityType);
  const container = containers.find((c: any) => c.type === containerType);
  if (!container?.config) return {};
  const configs: SubcontainerConfigs = {};
  for (const [type, val] of Object.entries(
    container.config as Record<string, any>,
  )) {
    const meta = typeof val.meta === 'function' ? val.meta() : val.meta || [];
    configs[type] = {
      label: val.label || type,
      metaInputs: meta.map((m: any) => ({
        key: m.key,
        label: m.label,
        schema: getMetaInputSchema(m.type, m),
        ...(m.options && { options: m.options }),
      })),
    };
  }
  return configs;
};

export const Schema = (context: AiContext): OpenAISchema => {
  const configs = getConfigs(context);
  const hasConfigs = Object.keys(configs).length > 0;
  const elementTypes = hasConfigs
    ? [...new Set(Object.values(configs).flatMap((c) => c.elementTypes || []))]
    : [];
  const subcontainerProps: Record<string, any> = {
    type: { type: 'string' },
    elements: getElementsSchema(elementTypes.length ? elementTypes : undefined),
  };
  const required = ['type', 'elements'];
  if (hasConfigs) {
    subcontainerProps.data = buildDataSchema(configs);
    required.push('data');
  }
  const subcontainerSchema = obj(subcontainerProps, required);
  return {
    type: 'json_schema',
    name: 'cc_structured_content',
    schema: obj(
      { subcontainers: { type: 'array', items: subcontainerSchema } },
      ['subcontainers'],
    ),
  };
};

const describeField = ({ key, label, options }: MetaField): string => {
  const base = `"${key}" (${label})`;
  const opts = options?.map((o) => o.value).join(', ');
  return opts ? `${base} [options: ${opts}]` : base;
};

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

export const getPrompt = (context: AiContext) => {
  const hasDocuments = !!context.repository.vectorStoreId;
  const documentGuideline = hasDocuments
    ? `- Base ALL content on the provided source documents
  - Reference specific information, data, and examples from the documents
  - Do not invent information not present in the documents`
    : '';
  return `
  Response should be a JSON object with a "subcontainers" array.
  Each subcontainer has:
  - "type": one of the available subcontainer types
  - "data": metadata object with the described fields filled in
  - "elements": array of content elements in
    [{ type: "${HTML_TYPE}", data: { "content": "" } }] format

  Available subcontainer types:
  ${describeSubcontainerTypes(getConfigs(context))}

  Guidelines:
  - Fill in ALL metadata fields described above with appropriate values
  - Generate 2-4 subcontainers to cover the topic comprehensively
  - Each subcontainer should have 2-5 content elements
  - Each content element should have substantial HTML content (200+ words)
  - Format content as HTML with suitable tags and headings
  - Apply text-body-2 mb-5 to paragraphs, text-h3 mb-7 to headings
  - Don't include more than 3 headings per subcontainer
  ${documentGuideline}`;
};

const spec: AiResponseSpec = {
  getPrompt,
  Schema,
  processResponse: (data: any = {}) => data?.subcontainers || [],
};

export default spec;

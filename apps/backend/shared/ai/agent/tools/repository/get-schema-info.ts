import { stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';

import type { ToolContext, ToolDef } from '../types.ts';
import { describeContainerSchema, getSchema } from '../helpers/index.ts';
import elementRegistry from '../../../../content-plugins/elementRegistry.js';

const api = schemaAPI as any;

const TOOL = 'get_schema_info';

type Input = Record<string, never>;

const description = stripIndent`
  Return the full schema definition for the current
  repository. Includes outline structure (activity types
  with parent-child rules and meta fields), container
  definitions (with subcontainer types, meta, and allowed
  element types), and element data schemas. Call before
  creating activities, containers, or elements to know
  what types and fields are available.
`;

const parameters = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

/**
 * Summarize an outline structure level with its type,
 * label, hierarchy rules, and meta field definitions.
 */
function summarizeLevel(level: any) {
  return {
    type: level.type,
    label: level.label,
    rootLevel: !!level.rootLevel,
    subLevels: level.subLevels || [],
    contentContainers: level.contentContainers || [],
    meta: (level.meta || []).map((m: any) => ({
      key: m.key,
      type: m.type,
      label: m.label,
    })),
  };
}

// Summarize a content container from its template's
// describeSchema result. Includes container-level and
// subcontainer-level meta/elementTypes when present.
function summarizeContainer(schemaId: string, container: any) {
  const desc = describeContainerSchema(schemaId, container.type);
  const pickMeta = (meta: any[]) =>
    (meta || []).map((m: any) => ({
      key: m.key,
      type: m.type,
      label: m.label,
    }));
  const pickElementTypes = (config: any) =>
    config ? api.getSupportedElementTypes(config) : [];
  const summary: Record<string, any> = {
    type: container.type,
    templateId: container.templateId,
    label: container.label,
  };
  // Container-level meta/elements (present on flat templates,
  // could also exist alongside subcontainers on future ones)
  if (desc.meta?.length) summary.meta = pickMeta(desc.meta);
  if (desc.elementConfig) {
    summary.elementTypes = pickElementTypes(desc.elementConfig);
  }
  // Subcontainer definitions with their own meta/elements
  const subs = desc.subcontainers || [];
  if (subs.length) {
    summary.subcontainers = subs.map((sub: any) => ({
      type: sub.type,
      label: sub.label,
      meta: pickMeta(sub.meta),
      elementTypes: pickElementTypes(sub.elementConfig),
    }));
  }
  return summary;
}

/**
 * Collect unique element types across all containers and
 * return their AI data schemas. The LLM uses these to
 * understand element data shapes when creating or updating
 * elements directly.
 */
function collectElementSchemas(contentContainers: any[]) {
  // Collect all unique element types from container summaries.
  // Walks any nesting without assuming a specific shape.
  const types = new Set<string>();
  const collect = (obj: any) => {
    for (const t of obj.elementTypes || []) types.add(t);
    for (const child of obj.subcontainers || []) collect(child);
  };
  contentContainers.forEach(collect);
  const schemas: Record<string, any> = {};
  for (const type of types) {
    const aiConfig = elementRegistry.getAiConfig(type);
    if (!aiConfig?.Schema?.schema) continue;
    const schema = aiConfig.Schema.schema;
    schemas[type] = {
      properties: schema.properties || {},
      required: schema.required || [],
    };
  }
  return schemas;
}

/**
 * Load the schema for the current repository and return
 * its full definition: outline taxonomy, container shapes
 * with subcontainer details, and element data schemas.
 */
async function execute(_input: Input, ctx: ToolContext) {
  const schemaId = ctx.repository.schema;
  const schema = getSchema(schemaId);
  const structure = (schema?.structure || []).map(summarizeLevel);
  const contentContainers = (schema?.contentContainers || []).map((c: any) =>
    summarizeContainer(schemaId, c),
  );
  const elementSchemas = collectElementSchemas(contentContainers);

  return {
    schemaId,
    name: schema?.name,
    structure,
    contentContainers,
    elementSchemas,
  };
}

export const get_schema_info: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

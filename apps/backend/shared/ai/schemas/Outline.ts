import type { AiContext } from '@tailor-cms/interfaces/ai.ts';
import { schema as schemaConfiguration } from '@tailor-cms/config';

import type { AiResponseSpec, OpenAISchema } from './interfaces.js';

const { getLevel, getOutlineLevels, getSchema } = schemaConfiguration;

const Schema: OpenAISchema = {
  type: 'json_schema',
  name: 'outline_structure',
  schema: {
    type: 'object',
    definitions: {
      activity: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          name: { type: 'string' },
          children: {
            type: 'array',
            items: { $ref: '#/definitions/activity' },
          },
        },
        required: ['name', 'type', 'children'],
        additionalProperties: false,
      },
    },
    properties: {
      activities: {
        type: 'array',
        items: {
          $ref: '#/definitions/activity',
        },
      },
    },
    required: ['activities'],
    additionalProperties: false,
  },
};

// Generate a textual representation of the taxonomy for a given schema.
// Consider the following structure: In the root level there are modules and
// pages. Modules can contain other modules and pages. Pages hold the content.
// The following text should be generated:
// In the root level of the taxonomy, the following node types are available:
// Module, Page. Module contains the following sublevels: Module, Page.
// Page contains the content.
const generateTaxonomyDesc = (schemaId: string): string => {
  const outlineLevels = getOutlineLevels(schemaId);
  if (!outlineLevels) throw new Error('Schema not found!');
  const generateTaxonDesc = (activityTypeConfig) => {
    const subLevels = activityTypeConfig.subLevels?.map(getLevel);
    if (!subLevels?.length) return '';
    const { label } = activityTypeConfig;
    const subLevelsLabel = subLevels.map(({ label }) => label).join(', ');
    const desc = `${label} contains the following sublevels: ${subLevelsLabel}.`;
    const withoutRecursion =
      subLevels?.filter((it) => it.type !== activityTypeConfig.type) || [];
    const structureDesc =
      desc + withoutRecursion?.map((it) => generateTaxonDesc(it)).join(' ');
    const nodeDesc = outlineLevels
      .map((it) => (it?.ai?.definition || '').trim())
      .join(' ');
    return `${structureDesc.trim()} ${nodeDesc.trim()}`;
  };
  const rootLevels = outlineLevels.filter((level) => level?.rootLevel);
  return `
    In the root level of the taxonomy, the following node types are available:
    ${rootLevels.map((level) => level.label).join(', ')}.
    ${rootLevels.map(generateTaxonDesc).join(' ')}
  `;
};

const getPrompt = (context: AiContext): string => {
  const { schemaId } = context.repository;
  const schema = getSchema(schemaId);
  const leafLevels = getOutlineLevels(schemaId).filter(
    (it) => it?.contentContainers?.length,
  );
  return `
    Generate a structure/outline for this content.
    The structure should be created by following the taxonomy of the
    "${schema.name}" specified as: ${generateTaxonomyDesc(schemaId).trim()}
    Return the response as a JSON object with the following format:
    { "name": "", "type": "", children: [] }
    where type indicates one of the taxonomy node types and children is an
    array of the same format. If possible, generate at least 10 root nodes.
    Make sure to have content holder nodes in the structure. The content
    holder nodes are the following:
    ${leafLevels.map((it) => it.label).join(', ')}.`;
};

const spec: AiResponseSpec = {
  Schema,
  getPrompt,
  processResponse: (val) => val?.activities || [],
};

export default spec;

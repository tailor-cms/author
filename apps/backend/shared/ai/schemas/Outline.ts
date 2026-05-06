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
  const generateTaxonDesc = (
    activityTypeConfig: Record<string, any>,
  ): string => {
    const subLevels: Record<string, any>[] =
      activityTypeConfig.subLevels?.map(getLevel) || [];
    if (!subLevels?.length) return '';
    const { label } = activityTypeConfig;
    const subLevelsLabel = subLevels
      .map(({ label }: Record<string, any>) => label)
      .join(', ');
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
  const hasDocuments = !!context.repository.vectorStoreId;
  const documentGuideline = hasDocuments
    ? `- Base the outline structure on the provided source documents
    - Derive sections and topics from the document content
    - Do not invent topics not covered in the documents`
    : '';
  return `
    Generate a structure/outline for this content.
    The structure should be created by following the taxonomy of the
    "${schema.name}" specified as: ${generateTaxonomyDesc(schemaId).trim()}
    Return the response as a JSON object with the following format:
    { "name": "", "type": "", children: [] }
    where type indicates one of the taxonomy node types and children is an
    array of the same format.
    Scope:
    - If the user states a count or range (e.g. "5 modules" or
      "1 chapter with 3 issues"), produce EXACTLY that. Honour
      explicit caps verbatim.
    - Otherwise, infer a realistic publishable scope for a
      "${schema.name}" of this subject. Use the subject and the
      repository description (${context.repository.description ||
      'no description provided'}) as the sizing signal. Match what
      a real author of this medium would actually commit to:
      a course usually has multiple modules with
      multiple lessons; a knowledge base has many sections.
      Do NOT emit a 1-2 root skeleton just to demonstrate the
      structure - lean toward generous breadth. A user can shrink
      afterwards, but an under-scoped outline forces a restart.
    - Target audience affects depth, complexity, and tone, NOT
      count. A BEGINNER course should have just as many modules
      as an EXPERT one - it just covers them differently.
    Make sure the structure includes content-holder nodes:
    ${leafLevels.map((it) => it.label).join(', ')}.
    Don't pad the result with a redundant top-level wrapper that simply
    mirrors the repository's name - the repository already serves that
    purpose. (For "${context.repository.name}", do NOT emit a single
    "${context.repository.name}" wrapper containing all real content.)
    A single legitimate root - e.g. one chapter the user explicitly
    asked for - is fine.
    ${documentGuideline}`;
};

const spec: AiResponseSpec = {
  Schema,
  getPrompt,
  processResponse: (val) => val?.activities || [],
  // Outline generation is a one-shot planning task - structuring a
  // whole repository's hierarchy benefits from deeper reasoning
  reasoningEffort: 'high',
};

export default spec;

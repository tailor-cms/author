import { stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import db from '#shared/database/index.js';
import type { ToolContext, ToolDef } from '../types.ts';

const { Activity } = db as any;
const api = schemaAPI as any;

const TOOL = 'get_repository';

type Input = Record<string, never>;

const description = stripIndent`
  Return metadata about the current repository including
  its schema, name, description, activity count, publishing
  status, vector store id, timestamps, and schema-defined
  metadata fields. Use to understand what you're working
  with before making changes. Call get_schema_info for the
  schema's structure and container definitions, get_outline
  for the activity tree.
`;

const parameters = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

/**
 * Return high-level repository metadata including schema,
 * activity count, publishing status, vector store id,
 * timestamps, and schema-defined meta fields with values.
 */
async function execute(_input: Input, ctx: ToolContext) {
  const { repository } = ctx;
  const activityCount = await Activity.count({
    where: {
      repositoryId: repository.id,
      detached: false,
    },
  });
  const vectorStoreId = repository.getVectorStoreId?.() || null;
  // Schema-defined repository metadata with current values
  // (e.g. tags, category, language - varies by schema)
  const meta = api.getRepositoryMetadata(repository) || [];

  return {
    id: repository.id,
    schemaId: repository.schema,
    vectorStoreId,
    name: repository.name,
    description: repository.description,
    meta,
    activityCount,
    createdAt: repository.createdAt,
    updatedAt: repository.updatedAt,
    hasUnpublishedChanges: !!repository.hasUnpublishedChanges,
  };
}

export const get_repository: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

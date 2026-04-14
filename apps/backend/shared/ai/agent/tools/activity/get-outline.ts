import { stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import type { ToolContext, ToolDef } from '../types.ts';
import { summarizeActivity } from '../helpers/index.ts';

// No input parameters for this tool.
type Input = Record<string, never>;

const TOOL = 'get_outline';

const description = stripIndent`
  Return the outline activity tree for the current repository.
  Only includes structure-level activities as defined by the
  schema (not containers or content elements). Returns each
  activity's id, type, label, name, parentId, and position,
  plus a markdown tree preview. Call this before creating,
  moving, or deleting activities to get current ids and
  hierarchy. Call get_schema_info to learn which outline
  types the schema defines.
`;

const parameters = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

/**
 * Convert activity summaries into a human-readable
 * indented markdown outline. Used in the tool response
 * so the LLM can reference the structure in its reply.
 */
function renderMarkdownTree(activities: any[]): string {
  const childrenOf = new Map<number | null, any[]>();
  for (const activity of activities) {
    const parentId = activity.parentId ?? null;
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId)!.push(activity);
  }
  const lines: string[] = [];
  function render(parentId: number | null, depth: number) {
    for (const activity of childrenOf.get(parentId) || []) {
      const indent = '  '.repeat(depth);
      const label = activity.label || activity.type;
      lines.push(`${indent}- **${activity.name}** _(${label})_ #${activity.id}`);
      render(activity.id, depth + 1);
    }
  }
  render(null, 0);
  return lines.join('\n');
}

/**
 * Fetch all outline activities for the current repository
 * and return summaries with a markdown tree preview.
 * Filters to outline types only (no containers or
 * subcontainers) using the schema structure.
 */
async function execute(_input: Input, ctx: ToolContext) {
  const outlineTypes = (schemaAPI as any)
    .getOutlineLevels(ctx.repository.schema)
    .map((level: any) => level.type);
  const rows = await ctx.repository.getActivities({
    where: {
      detached: false,
      type: outlineTypes,
    },
    order: [
      ['parentId', 'ASC NULLS FIRST'],
      ['position', 'ASC'],
    ],
  });
  const activities = rows.map(summarizeActivity);
  return {
    activities,
    markdown: renderMarkdownTree(activities),
  };
}

export const get_outline: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

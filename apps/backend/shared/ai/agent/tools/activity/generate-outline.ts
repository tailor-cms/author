import { oneLine, stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import db from '#shared/database/index.js';
import type { ToolContext, ToolDef } from '../types.ts';
import { resolveLabel, toolError } from '../helpers/index.ts';
import AiService from '../../../ai.service.ts';

const api = schemaAPI as any;
const { Asset } = db as any;
const TOOL = 'generate_outline';

interface Input {
  subject: string;
  instructions?: string | null;
  targetAudience?: string | null;
  assetIds?: number[] | null;
}

const description = stripIndent`
  Generate a structured outline for the repository. Returns
  a tree of activities matching the schema's structure types
  with a markdown preview. Does NOT persist - pass the result
  to create_outline which batch-creates all nodes in one call.
  Sizing: when the user states a count, pass it through in
  instructions. When unspecified, omit count guidance entirely
  so the generator picks a realistic scope for the medium - do
  not editorialise with "concise" or low caps the user did not
  request (a 2-chapter comic book or 2-module course is rarely
  what an author actually wants).
  Optionally pass assetIds to build the outline around existing
  resources (uploaded PDFs, imported articles, videos, etc.).
  Call list_assets first to find relevant resources.
`;

const parameters = {
  type: 'object',
  properties: {
    subject: {
      type: 'string',
      description: oneLine`
        What the outline should cover. Be specific about
        scope, domain, and intended coverage.
      `,
    },
    instructions: {
      type: ['string', 'null'],
      description: oneLine`
        Additional constraints for the outline. Pass through
        any explicit count or breadth the user stated (e.g.
        "2 modules max", "1 chapter with 3 issues") verbatim.
        Use this for tone, topic emphasis, or pedagogical
        constraints (e.g. "focus on practical exercises").
        Do NOT add "short", "concise", or numeric caps the
        user did not ask for - if breadth is unspecified, leave
        it unspecified so the generator can produce a realistic
        publishable scope for the medium.
      `,
    },
    targetAudience: {
      type: ['string', 'null'],
      enum: ['BEGINNER', 'INTERMEDIATE', 'EXPERT', null],
      description: oneLine`
        Target audience level. Affects depth and complexity.
        Defaults to INTERMEDIATE.
      `,
    },
    assetIds: {
      type: ['array', 'null'],
      items: { type: 'integer' },
      description: oneLine`
        Asset ids from the repository library to inform the
        outline. Their metadata (name, description, type, tags)
        is included in the generation context. If the repository
        has a vector store, indexed assets are searchable via
        file_search - pass findings in instructions instead.
      `,
    },
  },
  required: ['subject'],
  additionalProperties: false,
};

/**
 * Render a nested activity tree as indented markdown
 * for the LLM to reference in its reply.
 */
function renderPreviewTree(schemaId: string, nodes: any[], depth = 0): string {
  const lines: string[] = [];
  for (const node of nodes) {
    const indent = '  '.repeat(depth);
    const label = resolveLabel(schemaId, node.type);
    lines.push(`${indent}- **${node.name}** _(${label})_`);
    if (node.children?.length) {
      lines.push(renderPreviewTree(schemaId, node.children, depth + 1));
    }
  }
  return lines.join('\n');
}

/**
 * Build a compact type hierarchy description so the
 * LLM knows which types are valid children of which
 * when calling create_outline.
 */
function buildTypeHierarchy(schemaId: string): string {
  const levels = api.getOutlineLevels(schemaId);
  return levels
    .map((level: any) => {
      const root = level.rootLevel ? ' [root]' : '';
      const children = (level.subLevels || []).join(', ') || 'none (leaf)';
      return `${level.type}${root}: children=[${children}]`;
    })
    .join('; ');
}

/**
 * Validate the generated structure rejects the "one mega-root
 * containing the entire outline" pattern. A real single-root
 * outline (e.g. "1 chapter with 3 issues" the user explicitly
 * asked for) is fine because its children are sub-level types,
 * not root-level ones. Returns a violation message when the
 * shape is wrong, null when it's acceptable.
 */
function validateStructure(schemaId: string, nodes: any[]): string | null {
  if (nodes.length !== 1) return null;
  const root = nodes[0];
  const children = root?.children || [];
  if (children.length < 3) return null;
  const rootTypes = new Set(
    api
      .getOutlineLevels(schemaId)
      .filter((it: any) => it.rootLevel)
      .map((it: any) => it.type),
  );
  const allChildrenAreRootEligible = children.every((c: any) =>
    rootTypes.has(c.type),
  );
  if (!allChildrenAreRootEligible) return null;
  return oneLine`
    Single-wrapper outline rejected: produced one root
    "${root.name}" (${root.type}) holding ${children.length}
    children whose types are themselves root-eligible. The
    repository is the wrapper - those children must be the roots.
    Re-run generate_outline with instructions that explicitly
    forbid a top-level wrapper, OR pass the major sections of
    the source as the root activities directly.
  `;
}

/**
 * Flatten a nested tree into a list with _parentName
 * for parent-child resolution in create_outline.
 */
function flattenTree(
  nodes: any[],
  parentName?: string,
): { type: string; name: string; _parentName?: string }[] {
  const result: { type: string; name: string; _parentName?: string }[] = [];
  for (const node of nodes) {
    result.push({
      type: node.type,
      name: node.name,
      ...(parentName ? { _parentName: parentName } : {}),
    });
    if (node.children?.length) {
      result.push(...flattenTree(node.children, node.name));
    }
  }
  return result;
}

interface AssetSummary {
  name: string;
  type: string;
  description: string;
  tags: string[];
  isIndexed: boolean;
}

/**
 * Fetch asset metadata for the given ids. Filters to
 * assets belonging to the current repository.
 */
async function resolveAssets(
  assetIds: number[],
  ctx: ToolContext,
): Promise<AssetSummary[]> {
  const assets = await Asset.findAll({
    where: {
      id: assetIds,
      repositoryId: ctx.repository.id,
    },
  });
  return assets.map((asset: any) => ({
    name: asset.name,
    type: asset.type,
    description: asset.meta?.description || '',
    tags: asset.meta?.tags || [],
    isIndexed: !!asset.vectorStoreFileId,
  }));
}

/**
 * Generate a structured outline via the AI service.
 * Returns a tree preview, flattened activities for
 * create_outline, and schema type hierarchy.
 */
async function execute(input: Input, ctx: ToolContext) {
  if (!(AiService as any).generate) {
    return toolError({
      tool: TOOL,
      reason: 'ai_disabled',
      message: 'AI not configured.',
    });
  }

  const schemaId = ctx.repository.schema;

  // Build context from assets if provided
  let assetContext = '';
  if (input.assetIds?.length) {
    const assets = await resolveAssets(input.assetIds, ctx);
    if (assets.length) {
      const listing = assets
        .map((it) => `- ${it.name} (${it.type}): ${it.description || 'no desc'}`)
        .join('\n');
      assetContext = ` Build the outline around these resources:\n${listing}`;
    }
  }

  const text = oneLine`
    Generate an outline about: ${input.subject}.
    ${input.instructions ? `Additional: ${input.instructions}.` : ''}
    ${assetContext}
  `;

  const generated = await (AiService as any).generate({
    repository: {
      repositoryId: ctx.repository.id,
      schemaId,
      name: ctx.repository.name,
      description: ctx.repository.description || '',
    },
    inputs: [
      {
        type: 'CREATE',
        text,
        responseSchema: 'OUTLINE',
        targetAudience: input.targetAudience || 'INTERMEDIATE',
      },
    ],
  });

  const nodes = Array.isArray(generated) ? generated : [];
  const violation = validateStructure(schemaId, nodes);
  if (violation) {
    return toolError({
      tool: TOOL,
      reason: 'invalid_structure',
      message: violation,
    });
  }
  const markdown = nodes.length
    ? renderPreviewTree(schemaId, nodes)
    : '_(no activities generated)_';
  const activities = flattenTree(nodes);

  return {
    markdown,
    activities,
    typeHierarchy: buildTypeHierarchy(schemaId),
    NEXT_STEP: oneLine`
      THIS RESULT IS A DRAFT, NOTHING WAS WRITTEN TO THE DATABASE
      YET. You MUST call create_outline next, in this same turn,
      passing the entire activities array verbatim. It
      batch-creates all nodes in one call, resolving parent-child
      via _parentName. Do NOT stop here, do NOT reply with the
      outline as if it's been saved, and do NOT loop with
      create_activity - use create_outline.
    `,
  };
}

export const generate_outline: ToolDef = {
  name: TOOL,
  scope: 'generate',
  description,
  parameters,
  execute,
};

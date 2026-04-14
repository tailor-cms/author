import { oneLine, stripIndent } from 'common-tags';
import { schema as schemaAPI } from '@tailor-cms/config';
import db from '#shared/database/index.js';
import AiService from '../../../ai.service.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { buildLabels, labelFor, toolError } from '../helpers/index.ts';

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
        Additional constraints for the outline. E.g. "keep
        it short, 2 modules max" or "focus on practical
        exercises".
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
function renderPreviewTree(nodes: any[], labels: any, depth = 0): string {
  const lines: string[] = [];
  for (const node of nodes) {
    const indent = '  '.repeat(depth);
    const label = labelFor(labels, node.type) || node.type;
    lines.push(`${indent}- **${node.name}** _(${label})_`);
    if (node.children?.length) {
      lines.push(renderPreviewTree(node.children, labels, depth + 1));
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

/**
 * Fetch asset metadata for the given ids. Filters to
 * assets belonging to the current repository.
 */
async function resolveAssets(assetIds: number[], ctx: ToolContext) {
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
      assetContext = oneLine` Build the outline around these resources:
        ${JSON.stringify(assets)}.`;
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

  // Schema type -> human label map for the preview tree
  const labels = buildLabels(schemaId);
  const nodes = Array.isArray(generated) ? generated : [];
  const markdown = nodes.length
    ? renderPreviewTree(nodes, labels)
    : '_(no activities generated)_';

  return {
    activities: flattenTree(nodes),
    markdown,
    typeHierarchy: buildTypeHierarchy(schemaId),
    NEXT_STEP: oneLine`
      You MUST now call create_outline and pass the entire
      activities array. It batch-creates all nodes in one call,
      resolving parent-child via _parentName. Do NOT call
      create_activity one by one - use create_outline instead.
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

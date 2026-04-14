import { stripIndent } from 'common-tags';
import { AssetType } from '@tailor-cms/interfaces/asset.ts';
import * as assetService from '../../../../../asset/asset.service.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { toolError } from '../helpers/index.ts';

const TOOL = 'list_assets';

interface Input {
  type?: string | null;
  search?: string | null;
  limit?: number | null;
}

const description = stripIndent`
  Browse the repository asset library. Returns full
  metadata per asset so you can make decisions without
  follow-up calls. Use to:
  - Find existing media before generating new ones
  - Find assets to pass as assetIds to generate_outline
    or generate_container_content for richer output
  - Find images to attach via attach_asset_to_activity
  - Find reference material to index (index_assets)
    for file_search context during generation
  - Check isIndexed to know what's already searchable
  Search matches asset names. Use discover_resources
  to search the web for new resources to import.
`;

const parameters = {
  type: 'object',
  properties: {
    type: {
      type: ['string', 'null'],
      enum: [...Object.values(AssetType), null],
      description: 'Filter by asset type. Omit for all types.',
    },
    search: {
      type: ['string', 'null'],
      description: 'Search by asset name (case-insensitive).',
    },
    limit: {
      type: ['integer', 'null'],
      description: 'Max results (1-100). Defaults to 30.',
    },
  },
  additionalProperties: false,
};

/**
 * Query the repository asset library with optional
 * type and name filters. Returns a compact list with
 * metadata summaries and vector store indexing status.
 */
async function execute(input: Input, ctx: ToolContext) {
  const normalizedType = input.type
    ? String(input.type).toUpperCase()
    : undefined;
  const validTypes = Object.values(AssetType) as string[];
  if (normalizedType && !validTypes.includes(normalizedType)) {
    return toolError({
      tool: TOOL,
      reason: 'invalid_type',
      message: `"${input.type}" is not a valid asset type.`,
      allowedTypes: validTypes,
    });
  }
  const result = await assetService.list(ctx.repository.id, {
    type: normalizedType,
    search: input.search || undefined,
    limit: Math.min(input.limit || 30, 100),
    offset: 0,
    signed: true,
  } as any);
  const items = (result.items || []).map((asset: any) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    storageKey: asset.storageKey || null,
    publicUrl: asset.publicUrl || null,
    isIndexed: !!asset.vectorStoreFileId,
    meta: asset.meta || {},
  }));
  return { total: result.total, items };
}

export const list_assets: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

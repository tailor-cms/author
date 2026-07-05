import { oneLine, stripIndent } from 'common-tags';
import db from '#shared/database/index.js';
import * as assetService from '../../../../../asset/asset.service.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { toolError } from '../helpers/index.ts';

const { Asset } = db as any;

const TOOL = 'get_asset';

interface Input {
  id: number;
  includeUsages?: boolean | null;
}

const description = stripIndent`
  Fetch a single asset by id with full metadata, signed
  public URL, and indexing status. Use to:
  - Inspect before attaching via attach_asset_to_activity
  - Get the storageKey for IMAGE content elements
  - Check isIndexed to decide between file_search (indexed)
    or index_assets (not yet indexed) for content generation
  - Get publicUrl for preview or display
  - Review metadata before passing assetIds to generate_outline
  - Pass includeUsages: true to see every place it is
    referenced - check before deleting or replacing it,
    or when asked "where is this asset used?"
  For browsing the library, use list_assets instead.
`;

const parameters = {
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'Asset id to fetch.',
    },
    includeUsages: {
      type: ['boolean', 'null'],
      description: oneLine`
        When true, adds usageCount and the exact usages (content
        elements, activity meta, repository meta) referencing this
        asset. Costs an extra repository scan; omit otherwise.
      `,
    },
  },
  required: ['id'],
  additionalProperties: false,
};

/**
 * Look up one asset by primary key, verify it belongs to the current
 * repository, and return its metadata with a signed download URL,
 * indexing status and, on request, the exact places referencing it.
 */
async function execute(input: Input, ctx: ToolContext) {
  const asset = await Asset.findByPk(input.id);
  if (!asset || asset.repositoryId !== ctx.repository.id) {
    return toolError({
      tool: TOOL,
      reason: 'not_found',
      message: `Asset #${input.id} not found.`,
    });
  }
  let publicUrl: string | undefined;
  if (asset.storageKey) {
    try {
      const download = await assetService.getDownloadUrl(asset.storageKey);
      publicUrl = download.publicUrl;
    } catch {
      // Non-critical - asset exists but URL generation failed
    }
  }
  const usages = input.includeUsages
    ? await assetService.findUsages(ctx.repository, asset)
    : null;

  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    storageKey: asset.storageKey,
    publicUrl: publicUrl || null,
    isIndexed: !!asset.vectorStoreFileId,
    meta: asset.meta || {},
    ...(usages && { usageCount: usages.length, usages }),
  };
}

export const get_asset: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

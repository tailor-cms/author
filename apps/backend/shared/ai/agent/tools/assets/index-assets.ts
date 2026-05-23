import { oneLine, stripIndent } from 'common-tags';
import { ai as aiConfig } from '#config';
import { index } from '../../../../../asset/indexing/indexing.service.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { toolError } from '../helpers/index.ts';

const TOOL = 'index_assets';

interface Input {
  assetIds: number[];
}

const description = stripIndent`
  Index assets into the repository's vector store so the
  AI can access their content via file_search. This enables
  content generation grounded in source material - the AI
  can reference facts, data, and structure from indexed
  documents when generating outlines and container content.
  Call after uploading or importing new assets. Check
  isIndexed on list_assets to find unindexed assets.
  Indexing runs asynchronously - assets become searchable
  once processing completes.
`;

const parameters = {
  type: 'object',
  properties: {
    assetIds: {
      type: 'array',
      items: { type: 'integer' },
      description: oneLine`
        Asset ids to index. Must belong to the current
        repository. Assets already processing or completed
        are skipped. Failed assets are retried.
      `,
    },
  },
  required: ['assetIds'],
  additionalProperties: false,
};

/**
 * Trigger vector store indexing for the given assets.
 * Indexing runs asynchronously - this call queues the
 * assets and returns immediately. Each asset type has
 * a dedicated indexing strategy (document, link, image,
 * audio/video).
 */
async function execute(input: Input, ctx: ToolContext) {
  if (!aiConfig.isEnabled) {
    return toolError({
      tool: TOOL,
      reason: 'not_configured',
      message: 'AI is not configured.',
    });
  }

  if (!input.assetIds?.length) {
    return toolError({
      tool: TOOL,
      reason: 'empty',
      message: 'No asset ids provided.',
    });
  }

  try {
    const result = await index(ctx.repository, input.assetIds);
    if (!result) {
      return toolError({
        tool: TOOL,
        reason: 'no_eligible',
        message: oneLine`
          No eligible assets to index. Assets may already
          be indexed or processing.
        `,
      });
    }
    return {
      ok: true,
      vectorStoreId: result.storeId,
      queuedAssetIds: result.assetIds,
    };
  } catch (error: any) {
    return toolError({
      tool: TOOL,
      reason: 'failed',
      message: error.message,
    });
  }
}

export const index_assets: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};

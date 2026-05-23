import { oneLine, stripIndent } from 'common-tags';
import {
  ContentType,
  type ContentType as ContentTypeValue,
} from '@tailor-cms/interfaces/discovery.ts';
import * as assetService from '../../../../../asset/asset.service.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { recordOperation, toolError } from '../helpers/index.ts';

const TOOL = 'import_resource';

interface Input {
  url: string;
  title?: string | null;
  description?: string | null;
  downloadUrl?: string | null;
  contentType?: string | null;
  tags?: string[] | null;
  author?: string | null;
  license?: string | null;
}

const description = stripIndent`
  Import a web resource into the repository asset library.
  Use after discover_resources to bring the best results
  into the library. Images and PDFs are downloaded as files,
  videos and articles are stored as link assets with
  OpenGraph metadata. After importing, call index_assets to
  make the content searchable, or attach_asset_to_activity
  to set it on an activity's FILE meta field.
`;

const parameters = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: oneLine`
        URL of the resource to import. The page URL for
        articles/videos, or the direct file URL for
        images/PDFs.
      `,
    },
    title: {
      type: ['string', 'null'],
      description: 'Display name for the asset.',
    },
    description: {
      type: ['string', 'null'],
      description: oneLine`
        Description or alt text. Used for accessibility,
        search, and vector store indexing context.
      `,
    },
    contentType: {
      type: ['string', 'null'],
      enum: [...Object.values(ContentType), null],
      description: oneLine`
        Hint for import strategy. IMAGE and PDF are
        downloaded as files. VIDEO and ARTICLE are stored
        as link assets. Auto-detected if omitted.
      `,
    },
    downloadUrl: {
      type: ['string', 'null'],
      description: oneLine`
        Direct file URL for downloadable content. Pass
        from discover_resources result when available -
        may differ from the page URL.
      `,
    },
    tags: {
      type: ['array', 'null'],
      items: { type: 'string' },
      description: 'Tags for categorization and search.',
    },
    author: {
      type: ['string', 'null'],
      description: 'Attribution - original author or creator.',
    },
    license: {
      type: ['string', 'null'],
      description: 'License info (e.g. CC BY, Unsplash).',
    },
  },
  required: ['url'],
  additionalProperties: false,
};

/**
 * Import a URL into the repository asset library.
 * Delegates to assetService.importFromLink which handles
 * file download (images/PDFs), OpenGraph scraping (links),
 * and metadata extraction. Returns the created asset with
 * a signed public URL.
 */
async function execute(input: Input, ctx: ToolContext) {
  let url: string;
  try {
    url = new URL(input.url).href;
  } catch {
    return toolError({
      tool: TOOL,
      reason: 'invalid_url',
      message: `"${input.url}" is not a valid URL.`,
    });
  }
  try {
    const asset = await assetService.importFromLink(
      ctx.repository.id,
      ctx.userId,
      url,
      {
        title: input.title || undefined,
        description: input.description || undefined,
        altText: input.description || undefined,
        contentType: (input.contentType as ContentTypeValue) || undefined,
        downloadUrl: input.downloadUrl || undefined,
        tags: input.tags || undefined,
        author: input.author || undefined,
        license: input.license || undefined,
      },
    );
    let publicUrl: string | undefined;
    if (asset.storageKey) {
      try {
        const download = await assetService.getDownloadUrl(asset.storageKey);
        publicUrl = download.publicUrl;
      } catch {
        /* non-critical */
      }
    }
    const result = {
      ok: true,
      id: asset.id,
      name: asset.name,
      type: asset.type,
      storageKey: asset.storageKey || null,
      publicUrl: publicUrl || null,
      isIndexed: false,
      meta: asset.meta || {},
      _invalidates: ['assets'],
    };
    recordOperation(TOOL, input, result, ctx);
    return result;
  } catch (error: any) {
    return toolError({
      tool: TOOL,
      reason: 'import_failed',
      message: error.message,
    });
  }
}

export const import_resource: ToolDef = {
  name: TOOL,
  scope: 'write',
  description,
  parameters,
  execute,
};

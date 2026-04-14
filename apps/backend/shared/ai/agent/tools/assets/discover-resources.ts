import { oneLine, stripIndent } from 'common-tags';
import { discovery as discoveryConfig } from '#config';
import {
  ContentFilter,
  type ContentFilter as ContentFilterType,
  type DiscoveryResult,
} from '@tailor-cms/interfaces/discovery.ts';
import { search } from '../../../../../asset/discovery/discovery.service.ts';
import type { ToolContext, ToolDef } from '../types.ts';
import { toolError } from '../helpers/index.ts';

const TOOL = 'discover_resources';

interface Input {
  query: string;
  contentType?: string | null;
  count?: number | null;
}

const description = stripIndent`
  Search the web for resources relevant to a subject.
  Returns images, videos, articles, PDFs, and research
  papers. Use to find real-world media before generating
  content. Import results via import_resource, then
  optionally index them with index_assets to make their
  content searchable via file_search.
`;

const parameters = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: oneLine`
        Search query. Be specific - include the subject
        and what kind of resource you want (e.g. "JavaScript
        closures diagram", "machine learning introductory
        video").
      `,
    },
    contentType: {
      type: ['string', 'null'],
      enum: [...Object.values(ContentFilter), null],
      description: oneLine`
        Filter by content type. Defaults to ALL. Use IMAGE
        for diagrams/photos, VIDEO for YouTube/Vimeo,
        RESEARCH for academic papers, PDF for documents.
      `,
    },
    count: {
      type: ['integer', 'null'],
      description: 'Max results to return (1-30). Defaults to 10',
    },
  },
  required: ['query'],
  additionalProperties: false,
};

/**
 * Summarize a discovery result for the LLM. Includes
 * the url for import_resource and metadata for the
 * LLM to decide which results are worth importing.
 */
function summarizeResult(result: DiscoveryResult) {
  return {
    type: result.type,
    title: result.title,
    url: result.url,
    snippet: result.snippet,
    source: result.source,
    // Pass downloadUrl to import_resource for direct file imports
    downloadUrl: result.downloadUrl || null,
    description: result.description || null,
    tags: result.tags || null,
    author: result.author || null,
    license: result.license || null,
    altText: result.altText || null,
  };
}

/**
 * Search the web for resources via the discovery service.
 * Routes to provider-specific search (image, video,
 * academic, general) based on contentType.
 */
async function execute(input: Input, ctx: ToolContext) {
  if (!discoveryConfig.isEnabled) {
    return toolError({
      tool: TOOL,
      reason: 'not_configured',
      message: 'Resource discovery is not enabled.',
    });
  }
  const filter: ContentFilterType = (input.contentType || 'ALL') as ContentFilterType;
  const count = Math.min(input.count || 10, 30);
  try {
    const results = await search(
      input.query,
      ctx.repository,
      filter,
      count,
    );
    return {
      query: input.query,
      contentType: filter,
      results: results.map(summarizeResult),
    };
  } catch (error: any) {
    return toolError({
      tool: TOOL,
      reason: 'failed',
      message: error.message,
    });
  }
}

export const discover_resources: ToolDef = {
  name: TOOL,
  scope: 'read',
  description,
  parameters,
  execute,
};

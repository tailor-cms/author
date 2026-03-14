import AIService from '#shared/ai/ai.service.ts';
import { ai as aiConfig } from '#config';
import { createLogger } from '#logger';
import {
  ContentFilter, ContentType, MAX_SNIPPET, MAX_TITLE, truncate,
  type SearchResult,
} from './types.ts';

const logger = createLogger('asset:llm-search');

const ResultItem = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    url: { type: 'string' },
    snippet: { type: 'string' },
  },
  required: ['title', 'url', 'snippet'],
  additionalProperties: false,
};

const SCHEMA = {
  type: 'json_schema' as const,
  name: 'web_search_results',
  schema: {
    type: 'object',
    properties: {
      results: { type: 'array', items: ResultItem },
    },
    required: ['results'],
    additionalProperties: false,
  },
};

const PROMPT = `Search the web for the user's query.
Return only URLs found in your search results - never fabricate or guess URLs.
Derive titles and snippets from the actual page content.`;

const FILTER_HINTS: Partial<Record<ContentFilter, string>> = {
  [ContentFilter.Pdf]: 'Focus on PDF documents. Prefer URLs ending in .pdf.',
  [ContentFilter.Research]: 'Focus on academic papers, preprints, and research publications.',
  [ContentFilter.Data]: 'Focus on datasets, statistics, and open data repositories.',
  [ContentFilter.Article]: 'Focus on articles and news coverage.',
};

export async function webSearch(
  query: string,
  repositoryContext: string,
  filter: ContentFilter,
  count: number,
): Promise<SearchResult[]> {
  logger.debug({ query, filter, count }, 'Searching via LLM web search');
  const hint = FILTER_HINTS[filter] || '';
  const prompt = [PROMPT, hint, `Return up to ${count} results.`]
    .filter(Boolean).join('\n');
  const response = await AIService.client.responses.create({
    model: aiConfig.modelId,
    tools: [{ type: 'web_search_preview' }],
    text: { format: SCHEMA },
    input: [
      { role: 'developer', content: prompt },
      { role: 'user', content: `${repositoryContext}\n\nSearch: ${query}` },
    ],
  });
  const { results } = JSON.parse(response.output_text);
  const citedUrls = extractCitedUrls(response.output);
  logger.debug(
    { total: results.length, cited: citedUrls.size },
    'LLM search complete',
  );
  return results
    .filter((r: any) => r.url && r.title)
    // When citations are available, only keep URLs grounded in actual search
    .filter((r: any) => !citedUrls.size || citedUrls.has(r.url))
    .slice(0, count)
    .map(toSearchResult);
}

/**
 * Extracts URLs from url_citation annotations in the response output.
 * These are grounded in actual web search results.
 */
function extractCitedUrls(output: any[]): Set<string> {
  const urls = output
    .filter((it) => it.type === 'message')
    .flatMap((it) => it.content || [])
    .filter((it) => it.type === 'output_text')
    .flatMap((it) => it.annotations || [])
    .filter((it) => it.type === 'url_citation')
    .map((it) => it.url);
  return new Set(urls);
}

function toSearchResult(raw: any): SearchResult {
  return {
    title: truncate(raw.title, MAX_TITLE),
    url: raw.url,
    snippet: truncate(raw.snippet, MAX_SNIPPET),
    source: 'llm-web-search',
    type: ContentType.Article,
  };
}

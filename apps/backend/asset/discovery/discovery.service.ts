/**
 * Asset discovery - searches the web for resources relevant to a
 * repository. Routes queries to the right search APIs based on the
 * content filter, deduplicates results, and returns typed results.
 *
 * Two modes:
 * - Serper + Unsplash (primary) - parallel calls to Google Search,
 *   Images, News, Scholar, and Unsplash.
 * - LLM web search (fallback) - OpenAI web_search_preview tool
 *   when Serper is not configured or quota is exceeded.
 */
import { createError } from '#shared/error/helpers.js';
import { createLogger } from '#logger';
import { discovery as config } from '#config';
import pick from 'lodash/pick.js';
import { schema as schemaAPI } from '@tailor-cms/config';
import * as llmSearch from './llm-search.ts';
import * as serper from './serper.ts';
import * as unsplash from './unsplash.ts';

import {
  ContentFilter,
  QuotaExceededError,
  type DiscoveryResult,
  type SearchResult,
} from './types.ts';

const logger = createLogger('asset:discovery');

// Extra results fetched per source to compensate for dedup losses
const DEDUP_BUFFER = 5;
const DEFAULT_COUNT = 30;

// Academic papers, preprints, and research publications
const RESEARCH_SITES = [
  'site:arxiv.org', // Preprints (CS, physics, math)
  'site:scholar.google.com', // Aggregated academic search
  'site:pubmed.ncbi.nlm.nih.gov', // Biomedical literature
  'site:semanticscholar.org', // AI-powered academic search
  'site:ieee.org', // Engineering & CS journals
  'site:researchgate.net', // Researcher-shared papers
  'site:ssrn.com', // Finance, economics, law
  'site:nber.org', // Economics working papers
  'site:repec.org', // Economics papers & rankings
].join(' OR ');

// Datasets, statistics, and open data repositories
const DATA_SITES = [
  'site:kaggle.com', // ML datasets & competitions
  'site:data.gov', // US government open data
  'site:github.com', // Code & data repositories
  'site:huggingface.co', // ML models & datasets
  'site:datasetsearch.research.google.com', // Google dataset search
  'site:registry.opendata.aws', // AWS open data
  'site:fred.stlouisfed.org', // Federal Reserve economic data
  'site:data.worldbank.org', // World Bank development indicators
  'site:data.imf.org', // IMF international finance data
  'site:data.oecd.org', // OECD economic & social statistics
  'site:data.europa.eu', // EU open data & Eurostat
].join(' OR ');

function buildRepoContext(repository: any): string {
  const parts = [`Repository: "${repository.name}"`];
  if (repository.description) {
    parts.push(`Description: "${repository.description}"`);
  }
  const schema = schemaAPI.getSchema(repository.schema);
  if (schema) parts.push(`Content type: ${schema.name}`);
  return parts.join('\n');
}

function dedupeByUrl(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

function toResult(raw: SearchResult): DiscoveryResult {
  const thumb = raw.thumbnailUrl || raw.imageUrl;
  return {
    ...pick(raw, [
      'title',
      'url',
      'snippet',
      'type',
      'downloadUrl',
      'author',
      'license',
      'description',
      'tags',
    ]),
    ...(thumb && { thumbnailUrl: thumb }),
  };
}

/** Dedup, trim to count, and map to frontend shape. */
function normalize(raw: SearchResult[], count: number): DiscoveryResult[] {
  return dedupeByUrl(raw).slice(0, count).map(toResult);
}

/**
 * Budget allocation across Serper endpoints per filter.
 *
 * Each strategy distributes the requested count across search types,
 * adding DEDUP_BUFFER extra per source to compensate for duplicates
 * removed during normalization.
 *
 * Percentages (for "all" filter):
 * - 55% web - primary broad results
 * - 30% images - visual content
 * - 15% news - recent/topical
 * - 15% unsplash - high-quality stock photos
 */
type Strategy = (q: string, n: number) => Promise<SearchResult[]>[];

const { All, Article, Image, Video, Pdf, Research, Data, Other } =
  ContentFilter;

const strategies: Record<ContentFilter, Strategy> = {
  [All]: (q, n) => [
    serper.webSearch(q, Math.ceil(n * 0.55) + DEDUP_BUFFER),
    serper.imageSearch(q, Math.ceil(n * 0.3) + DEDUP_BUFFER),
    unsplash.search(q, Math.ceil(n * 0.15)),
    serper.newsSearch(q, Math.ceil(n * 0.15) + DEDUP_BUFFER),
  ],
  [Image]: (q, n) => [
    serper.imageSearch(q, n + DEDUP_BUFFER),
    unsplash.search(q, Math.ceil(n / 2)),
  ],
  [Video]: (q, n) => [serper.videoSearch(q, n + DEDUP_BUFFER)],
  [Pdf]: (q, n) => [serper.webSearch(`${q} filetype:pdf`, n + DEDUP_BUFFER)],
  [Article]: (q, n) => [
    serper.newsSearch(q, Math.ceil(n * 0.6) + DEDUP_BUFFER),
    serper.webSearch(q, Math.ceil(n * 0.5) + DEDUP_BUFFER),
  ],
  [Research]: (q, n) => [
    serper.scholarSearch(q, n + DEDUP_BUFFER),
    serper.webSearch(`${q} ${RESEARCH_SITES}`, Math.ceil(n / 2)),
  ],
  [Data]: (q, n) => {
    const keywords = `${q} dataset OR "open data" OR statistics`;
    return [
      serper.webSearch(keywords, Math.ceil(n * 0.6) + DEDUP_BUFFER),
      serper.webSearch(`${q} ${DATA_SITES}`, Math.ceil(n * 0.5) + DEDUP_BUFFER),
    ];
  },
  [Other]: (q, n) => [serper.webSearch(q, n + DEDUP_BUFFER)],
};

async function fetchAll(
  promises: Promise<SearchResult[]>[],
): Promise<SearchResult[]> {
  const batches = await Promise.all(
    promises.map((p) =>
      p.catch((err: Error) => {
        if (err instanceof QuotaExceededError) throw err;
        logger.warn({ err: err.message }, 'Search source failed');
        return [] as SearchResult[];
      }),
    ),
  );
  return batches.flat();
}

async function fetchWithSerper(
  query: string,
  filter: ContentFilter,
  count: number,
): Promise<SearchResult[]> {
  if (!Object.hasOwn(strategies, filter)) {
    return createError(400, `Unknown content filter: ${filter}`);
  }
  const strategy = strategies[filter as ContentFilter];
  if (typeof strategy !== 'function') {
    return createError(400, `Invalid strategy for filter: ${filter}`);
  }
  return fetchAll(strategy(query, count));
}

async function fetchWithLlm(
  query: string,
  repoContext: string,
  filter: ContentFilter,
  count: number,
): Promise<SearchResult[]> {
  const fetches: Promise<SearchResult[]>[] = [];
  if (filter !== ContentFilter.Image) {
    fetches.push(llmSearch.webSearch(query, repoContext, filter, count));
  }
  if (filter === ContentFilter.All || filter === ContentFilter.Image) {
    fetches.push(unsplash.search(query, Math.ceil(count / 3)));
  }
  return fetchAll(fetches);
}

/** Searches the web for resources matching the query and filter. */
async function search(
  query: string,
  repository: any,
  contentFilter: ContentFilter = ContentFilter.All,
  count = DEFAULT_COUNT,
): Promise<DiscoveryResult[]> {
  const repoContext = buildRepoContext(repository);
  let raw: SearchResult[];
  if (!config.serper.isEnabled) {
    logger.info('Serper not configured, using LLM fallback');
    raw = await fetchWithLlm(query, repoContext, contentFilter, count);
  } else {
    try {
      raw = await fetchWithSerper(query, contentFilter, count);
    } catch (err) {
      if (!(err instanceof QuotaExceededError)) throw err;
      logger.warn('Serper quota exceeded, falling back to LLM search');
      raw = await fetchWithLlm(query, repoContext, contentFilter, count);
    }
  }
  const results = normalize(raw, count);
  logger.info(
    { query, contentFilter, raw: raw.length, results: results.length },
    'Discovery complete',
  );
  return results;
}

export { search };

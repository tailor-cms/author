// Asset discovery - searches the web for resources relevant to a
// repository. Routes queries to the right search APIs based on the
// content filter, deduplicates results, and returns typed results.
//
// Two modes:
// - Serper + Unsplash (primary) - parallel calls to Google Search,
//   Images, News, Scholar, and Unsplash.
// - LLM web search (fallback) - OpenAI web_search_preview tool
//   when Serper is not configured or quota is exceeded.
import { createError } from '#shared/error/helpers.js';
import { createLogger } from '#logger';
import { discovery as config } from '#config';
import { schema as schemaAPI } from '@tailor-cms/config';
import * as llmSearch from './llm-search.ts';
import * as serper from './serper.ts';
import * as unsplash from './unsplash.ts';

import {
  ContentFilter,
  QuotaExceededError,
  type DiscoveryResult,
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

// Used for LLM search to provide more context about the search
function buildRepoContext(repository: any): string {
  const schema = schemaAPI.getSchema(repository.schema);
  const parts = [
    `Repository: "${repository.name}"`,
    `Description: "${repository.description}"`,
    `Repository type: ${schema.name}`,
  ];
  return parts.join('\n');
}

// Removes duplicates based on URL, keeping the first occurrence.
function dedupeByUrl(results: DiscoveryResult[]): DiscoveryResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

// Dedup and trim to requested count.
function normalize(raw: DiscoveryResult[], count: number): DiscoveryResult[] {
  return dedupeByUrl(raw).slice(0, count);
}

// Budget allocation across Serper endpoints per filter.
//
// Each strategy distributes the requested count across search types,
// adding DEDUP_BUFFER extra per source to compensate for duplicates
// removed during normalization.
//
// Percentages (for "all" filter):
// - 45% web - primary broad results
// - 15% images - visual content (Google)
// - 25% unsplash - high-quality stock photos
// - 15% news - recent/topical
type Strategy = (q: string, n: number) => Promise<DiscoveryResult[]>[];

const { All, Article, Image, Video, Pdf, Research, Other } =
  ContentFilter;

const strategies: Record<ContentFilter, Strategy> = {
  [All]: (q, n) => [
    serper.webSearch(q, Math.ceil(n * 0.45) + DEDUP_BUFFER),
    serper.imageSearch(q, Math.ceil(n * 0.15) + DEDUP_BUFFER),
    unsplash.search(q, Math.ceil(n * 0.25)),
    serper.newsSearch(q, Math.ceil(n * 0.15) + DEDUP_BUFFER),
  ],
  [Image]: (q, n) => [
    unsplash.search(q, Math.ceil(n * 0.6)),
    serper.imageSearch(q, Math.ceil(n * 0.4) + DEDUP_BUFFER),
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
  [Other]: (q, n) => [serper.webSearch(q, n + DEDUP_BUFFER)],
};

async function gatherResults(
  promises: Promise<DiscoveryResult[]>[],
): Promise<DiscoveryResult[]> {
  const batches = await Promise.all(
    promises.map((p) =>
      p.catch((err: Error) => {
        if (err instanceof QuotaExceededError) throw err;
        logger.warn({ err: err.message }, 'Search source failed');
        return [] as DiscoveryResult[];
      }),
    ),
  );
  return batches.flat();
}

async function fetchFromProviders(
  query: string,
  filter: ContentFilter,
  count: number,
): Promise<DiscoveryResult[]> {
  if (!Object.hasOwn(strategies, filter)) {
    return createError(400, `Unknown content filter: ${filter}`);
  }
  return gatherResults(strategies[filter as ContentFilter](query, count));
}

async function fetchFromLlm(
  query: string,
  repoContext: string,
  filter: ContentFilter,
  count: number,
): Promise<DiscoveryResult[]> {
  const fetches: Promise<DiscoveryResult[]>[] = [];
  if (filter !== ContentFilter.Image) {
    fetches.push(llmSearch.webSearch(query, repoContext, filter, count));
  }
  // LLM is weak for image search, so we supplement with Unsplash
  if (filter === ContentFilter.All || filter === ContentFilter.Image) {
    fetches.push(unsplash.search(query, Math.ceil(count / 3)));
  }
  return gatherResults(fetches);
}

// Searches the web for resources matching the query and filter.
async function search(
  query: string,
  repository: any,
  contentFilter: ContentFilter = ContentFilter.All,
  count = DEFAULT_COUNT,
): Promise<DiscoveryResult[]> {
  const repoContext = buildRepoContext(repository);
  let raw: DiscoveryResult[];
  if (!config.serper.isEnabled) {
    logger.info('Serper not configured, using LLM fallback');
    raw = await fetchFromLlm(query, repoContext, contentFilter, count);
  } else {
    try {
      raw = await fetchFromProviders(query, contentFilter, count);
    } catch (err) {
      if (!(err instanceof QuotaExceededError)) throw err;
      logger.warn('Serper quota exceeded, falling back to LLM search');
      raw = await fetchFromLlm(query, repoContext, contentFilter, count);
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

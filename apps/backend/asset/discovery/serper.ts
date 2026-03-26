import axios from 'axios';
import { discovery as config } from '#config';
import { createLogger } from '#logger';
import {
  ContentType,
  MAX_SNIPPET,
  MAX_TITLE,
  QuotaExceededError,
  truncate,
  type SearchResult,
} from './types.ts';

const logger = createLogger('asset:serper');

const { apiUrl, apiKey, timeout } = config.serper;
const HEADERS = { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' };

async function search(
  endpoint: string,
  params: Record<string, unknown>,
  key: string,
  mapper: (item: any) => SearchResult,
): Promise<SearchResult[]> {
  logger.debug({ endpoint, query: params.q, count: params.num }, 'Searching');
  try {
    const { data } = await axios.post(`${apiUrl}${endpoint}`, params, {
      headers: HEADERS,
      timeout,
    });
    const all = (data[key] || []).map(mapper);
    const results = all.filter((r: SearchResult) => r.url);
    if (all.length !== results.length) {
      logger.warn(
        { endpoint, dropped: all.length - results.length },
        'Dropped results without URLs',
      );
    }
    logger.debug({ endpoint, results: results.length }, 'Search complete');
    return results;
  } catch (err: any) {
    if (err.response?.status === 429) throw new QuotaExceededError('serper');
    throw err;
  }
}

function detectType(url: string): SearchResult['type'] {
  try {
    if (new URL(url).pathname.toLowerCase().endsWith('.pdf'))
      return ContentType.Pdf;
  } catch {
    /* malformed URL */
  }
  return ContentType.Article;
}

function toWebResult(item: any): SearchResult {
  const url = item.link || '';
  return {
    title: truncate(item.title, MAX_TITLE),
    url,
    snippet: truncate(item.snippet, MAX_SNIPPET),
    source: 'google',
    type: detectType(url),
  };
}

function toImageResult(item: any): SearchResult {
  const title = truncate(item.title, MAX_TITLE);
  // For images: prefer page link, fall back to the image URL itself
  const url = item.link || item.imageUrl || item.thumbnailUrl || '';
  return {
    title,
    url,
    imageUrl: item.imageUrl || '',
    thumbnailUrl: item.thumbnailUrl || '',
    downloadUrl: item.imageUrl || item.link || '',
    snippet: `Image from ${item.source || item.domain || 'web'}`,
    description: title,
    source: 'google-images',
    type: ContentType.Image,
  };
}

function toNewsResult(item: any): SearchResult {
  return {
    title: truncate(item.title, MAX_TITLE),
    url: item.link || '',
    snippet: truncate(item.snippet, MAX_SNIPPET),
    source: 'google-news',
    type: ContentType.Article,
  };
}

function toScholarResult(item: any): SearchResult {
  // publicationInfo.summary is "Author1, Author2 - Journal, Year" format
  const author = item.publicationInfo?.summary || '';
  const year = item.year || '';
  const cited = item.citedBy?.total;
  const parts = [truncate(item.snippet, MAX_SNIPPET)];
  if (year) parts.push(`Year: ${year}`);
  if (cited) parts.push(`Cited by: ${cited}`);
  return {
    title: truncate(item.title, MAX_TITLE),
    url: item.link || '',
    snippet: parts.join(' | '),
    source: 'google-scholar',
    type: ContentType.Research,
    ...(author && { author }),
  };
}

function resolveVideoUrl(item: any): string {
  // Primary: direct link field
  if (item.link) return item.link;
  // Fallback: try to extract YouTube URL from thumbnail (contains video ID)
  const thumb = item.imageUrl || item.thumbnailUrl || '';
  const ytThumbMatch = thumb.match(
    /img\.youtube\.com\/vi\/([a-zA-Z0-9_-]+)\//,
  );
  if (ytThumbMatch) return `https://www.youtube.com/watch?v=${ytThumbMatch[1]}`;
  // Fallback: source field (sometimes contains a URL)
  if (item.source && /^https?:\/\//.test(item.source)) return item.source;
  return '';
}

function toVideoResult(item: any): SearchResult {
  return {
    title: truncate(item.title, MAX_TITLE),
    url: resolveVideoUrl(item),
    snippet: truncate(item.snippet || item.description || '', MAX_SNIPPET),
    thumbnailUrl: item.imageUrl || item.thumbnailUrl || '',
    source: 'google-videos',
    type: ContentType.Video,
    ...(item.channel && { author: item.channel }),
  };
}

export function webSearch(query: string, count = 20) {
  return search('/search', { q: query, num: count }, 'organic', toWebResult);
}

export function imageSearch(query: string, count = 20) {
  return search('/images', { q: query, num: count }, 'images', toImageResult);
}

export function newsSearch(query: string, count = 10) {
  return search('/news', { q: query, num: count }, 'news', toNewsResult);
}

export function scholarSearch(query: string, count = 10) {
  return search(
    '/scholar',
    { q: query, num: count },
    'organic',
    toScholarResult,
  );
}

export function videoSearch(query: string, count = 10) {
  return search('/videos', { q: query, num: count }, 'videos', toVideoResult);
}

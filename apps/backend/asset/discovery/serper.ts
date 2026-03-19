import axios from 'axios';
import { discovery as config } from '#config';
import { createLogger } from '#logger';
import {
  ContentType, MAX_SNIPPET, MAX_TITLE, QuotaExceededError, truncate,
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
    const results = (data[key] || []).map(mapper);
    logger.debug({ endpoint, results: results.length }, 'Search complete');
    return results;
  } catch (err: any) {
    if (err.response?.status === 429) throw new QuotaExceededError('serper');
    throw err;
  }
}

function detectType(url: string): SearchResult['type'] {
  try {
    if (new URL(url).pathname.toLowerCase().endsWith('.pdf')) return ContentType.Pdf;
  } catch { /* malformed URL */ }
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
  return {
    title,
    url: item.link || '',
    imageUrl: item.imageUrl || '',
    thumbnailUrl: item.thumbnailUrl || '',
    downloadUrl: item.imageUrl || '',
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
  return search('/scholar', { q: query, num: count }, 'organic', toScholarResult);
}

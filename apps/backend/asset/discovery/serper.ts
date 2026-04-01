import axios from 'axios';
import { discovery as config } from '#config';
import { createLogger } from '#logger';
import { ContentType, QuotaExceededError, type DiscoveryResult } from './types.ts';
import { truncate } from './utils.ts';

const logger = createLogger('asset:serper');

const { apiUrl, apiKey, timeout } = config.serper;

const SNIPPET_MAX_LENGTH = 1000;
const HEADERS = { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' };

// Serper response key per endpoint:
// /search, /scholar -> 'organic'
// /images -> 'images', /news -> 'news', /videos -> 'videos'
async function search(
  endpoint: string,
  params: Record<string, unknown>,
  key: string,
  mapper: (item: any) => DiscoveryResult,
): Promise<DiscoveryResult[]> {
  logger.debug({ endpoint, query: params.q, count: params.num }, 'Searching');
  try {
    const { data } = await axios.post(`${apiUrl}${endpoint}`, params, {
      headers: HEADERS,
      timeout,
    });
    const all = (data[key] || []).map(mapper);
    const results = all.filter((r: DiscoveryResult) => r.url);
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

function detectType(url: string): DiscoveryResult['type'] {
  try {
    if (new URL(url).pathname.toLowerCase().endsWith('.pdf'))
      return ContentType.Pdf;
  } catch {
    // malformed URL
  }
  return ContentType.Article;
}

function toWebResult(item: any): DiscoveryResult {
  const url = item.link || '';
  return {
    type: detectType(url),
    url,
    title: truncate(item.title),
    snippet: truncate(item.snippet, SNIPPET_MAX_LENGTH),
    source: 'google',
  };
}

function toImageResult(item: any): DiscoveryResult {
  const title = truncate(item.title);
  // For images: prefer page link, fall back to the image URL itself
  const url = item.link || item.imageUrl || item.thumbnailUrl || '';
  return {
    type: ContentType.Image,
    url,
    downloadUrl: item.imageUrl || item.link || '',
    thumbnailUrl: item.thumbnailUrl || item.imageUrl || '',
    title,
    altText: title,
    snippet: `Image from ${item.source || item.domain || 'web'}`,
    description: title,
    source: 'google-images',
  };
}

function toNewsResult(item: any): DiscoveryResult {
  return {
    type: ContentType.Article,
    url: item.link || '',
    title: truncate(item.title),
    snippet: truncate(item.snippet, SNIPPET_MAX_LENGTH),
    source: 'google-news',
  };
}

function toScholarResult(item: any): DiscoveryResult {
  // publicationInfo.summary is "Author1, Author2 - Journal, Year" format
  const author = item.publicationInfo?.summary || '';
  const year = item.year || '';
  const cited = item.citedBy?.total;
  const parts = [truncate(item.snippet, SNIPPET_MAX_LENGTH)];
  if (year) parts.push(`Year: ${year}`);
  if (cited) parts.push(`Cited by: ${cited}`);
  return {
    type: ContentType.Research,
    url: item.link || '',
    title: truncate(item.title),
    snippet: parts.join(' | '),
    source: 'google-scholar',
    ...(author && { author }),
  };
}

// Serper /videos response is inconsistent about where the video URL lives.
// Try in order: direct link, YouTube ID from thumbnail, source field.
function resolveVideoUrl(item: any): string {
  if (item.link) return item.link;
  // YouTube thumbnails embed the video ID (e.g. img.youtube.com/vi/<id>/...)
  const thumb = item.imageUrl || item.thumbnailUrl || '';
  const ytMatch = thumb.match(/img\.youtube\.com\/vi\/([a-zA-Z0-9_-]+)\//);
  if (ytMatch) return `https://www.youtube.com/watch?v=${ytMatch[1]}`;
  // source is normally a domain, but occasionally a full URL
  if (item.source && /^https?:\/\//.test(item.source)) return item.source;
  return '';
}

function toVideoResult(item: any): DiscoveryResult {
  return {
    type: ContentType.Video,
    url: resolveVideoUrl(item),
    title: truncate(item.title),
    snippet: truncate(item.snippet || item.description || '', SNIPPET_MAX_LENGTH),
    thumbnailUrl: item.imageUrl || item.thumbnailUrl || '',
    source: 'google-videos',
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

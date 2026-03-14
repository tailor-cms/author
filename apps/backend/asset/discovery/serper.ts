import axios from 'axios';
import { ai as aiConfig } from '#config';
import { createLogger } from '#logger';
import type { SearchResult } from './types.ts';

const logger = createLogger('asset:serper');

const { apiUrl, apiKey, timeout } = aiConfig.discovery.serper;
const HEADERS = { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' };

async function search(
  endpoint: string,
  params: Record<string, unknown>,
  key: string,
  mapper: (item: any) => SearchResult,
): Promise<SearchResult[]> {
  logger.debug({ endpoint, query: params.q, count: params.num }, 'Searching');
  const { data } = await axios.post(`${apiUrl}${endpoint}`, params, {
    headers: HEADERS,
    timeout,
  });
  const results = (data[key] || []).map(mapper);
  logger.debug({ endpoint, results: results.length }, 'Search complete');
  return results;
}

function toWebResult(item: any): SearchResult {
  return {
    title: String(item.title || '').slice(0, 500),
    url: item.link || '',
    snippet: String(item.snippet || '').slice(0, 1000),
    date: item.date || '',
    source: 'google',
  };
}

function toImageResult(item: any): SearchResult {
  return {
    title: String(item.title || '').slice(0, 500),
    url: item.link || '',
    imageUrl: item.imageUrl || '',
    thumbnailUrl: item.thumbnailUrl || '',
    domain: item.domain || '',
    snippet: `Image from ${item.source || item.domain || 'web'}`,
    source: 'google-images',
  };
}

function toNewsResult(item: any): SearchResult {
  return {
    title: String(item.title || '').slice(0, 500),
    url: item.link || '',
    snippet: String(item.snippet || '').slice(0, 1000),
    date: item.date || '',
    source: 'google-news',
  };
}

function toScholarResult(item: any): SearchResult {
  return {
    title: String(item.title || '').slice(0, 500),
    url: item.link || '',
    snippet: String(item.snippet || '').slice(0, 1000),
    year: item.year || '',
    citedBy: item.citedBy?.total || 0,
    authors: item.publicationInfo?.summary || '',
    source: 'google-scholar',
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

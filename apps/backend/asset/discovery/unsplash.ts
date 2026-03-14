import axios from 'axios';
import { discovery as config } from '#config';
import { createLogger } from '#logger';
import type { SearchResult } from './types.ts';

const logger = createLogger('asset:unsplash');

const { apiUrl, accessKey, timeout } = config.unsplash;

export async function search(
  query: string,
  count = 30,
): Promise<SearchResult[]> {
  if (!config.unsplash.isEnabled) {
    logger.debug('Unsplash not configured, skipping');
    return [];
  }
  logger.debug({ query, count }, 'Searching');
  const { data } = await axios.get(`${apiUrl}/search/photos`, {
    params: { query, per_page: count },
    headers: { Authorization: `Client-ID ${accessKey}` },
    timeout,
  });
  if (!data?.results?.length) return [];
  const results = data.results.map(toSearchResult);
  logger.debug({ results: results.length }, 'Search complete');
  return results;
}

function toSearchResult(photo: any): SearchResult {
  const snippetBase = `Photo by ${photo.user?.name || 'Unknown'} on Unsplash.`;
  return {
    title: String(
      photo.description || photo.alt_description || 'Unsplash photo',
    ).slice(0, 500),
    url: photo.links?.html || `https://unsplash.com/photos/${photo.id}`,
    imageUrl: photo.urls?.regular || photo.urls?.small || '',
    thumbnailUrl: photo.urls?.thumb || '',
    snippet: `${snippetBase} ${photo.alt_description || ''}`,
    source: 'unsplash',
  };
}

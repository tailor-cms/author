import axios from 'axios';
import { discovery as config } from '#config';
import { createLogger } from '#logger';
import { ContentType, type SearchResult } from './types.ts';
import { truncate } from './utils.ts';

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
  const author = photo.user?.name || 'Unknown';
  const description = photo.description || photo.alt_description || '';
  const tags = (photo.tags || [])
    .map((t: any) => t.title)
    .filter(Boolean);
  return {
    type: ContentType.Image,
    url: photo.links?.html || `https://unsplash.com/photos/${photo.id}`,
    imageUrl: photo.urls?.regular || photo.urls?.small || '',
    thumbnailUrl: photo.urls?.thumb || '',
    downloadUrl: photo.urls?.full || photo.urls?.regular || '',
    title: truncate(description || 'Unsplash photo'),
    snippet: `Photo by ${author} on Unsplash. ${photo.alt_description || ''}`,
    source: 'unsplash',
    author,
    license: 'Unsplash License',
    description,
    tags,
    altText: photo.alt_description || '',
  };
}

import axios from 'axios';
import { discovery as config } from '#config';
import { createLogger } from '#logger';
import { ContentType, type DiscoveryResult } from './types.ts';
import { truncate } from './utils.ts';

const logger = createLogger('asset:unsplash');

const { apiUrl, apiKey, timeout } = config.unsplash;

export async function search(
  query: string,
  count = 30,
): Promise<DiscoveryResult[]> {
  if (!config.unsplash.isEnabled) {
    logger.debug('Unsplash not configured, skipping');
    return [];
  }
  logger.debug({ query, count }, 'Searching');
  const { data } = await axios.get(`${apiUrl}/search/photos`, {
    headers: { Authorization: `Client-ID ${apiKey}` },
    params: { query, per_page: count },
    timeout,
  });
  if (!data?.results?.length) return [];
  const results = data.results.map(toDiscoveryResult);
  logger.debug({ results: results.length }, 'Search complete');
  return results;
}

function toDiscoveryResult(photo: any): DiscoveryResult {
  const author = photo.user?.name || 'Unknown';
  const description = photo.description || photo.alt_description || '';
  const tags = (photo.tags || [])
    .map((t: any) => t.title)
    .filter(Boolean);
  return {
    type: ContentType.Image,
    url: photo.links?.html || `https://unsplash.com/photos/${photo.id}`,
    thumbnailUrl: photo.urls?.thumb || photo.urls?.small || '',
    downloadUrl: photo.urls?.full || photo.urls?.regular || '',
    title: truncate(description || 'Unsplash photo'),
    altText: photo.alt_description || '',
    snippet: `Photo by ${author} on Unsplash. ${photo.alt_description || ''}`,
    source: 'unsplash',
    author,
    license: 'Unsplash License',
    description,
    tags,
  };
}

/**
 * Describes a URL by fetching its metadata.
 */
import type { UrlDescription } from '../schemas/url-description.ts';
import { fetchOpenGraph } from './open-graph.ts';
import { createKvStore } from '#shared/kvStore.ts';
import { detectLinkProvider } from '@tailor-cms/common/asset';

const TTL = 6 * 60 * 60 * 1000;

const cache = createKvStore<UrlDescription>({
  ttl: TTL,
  namespace: 'url-description',
});

export async function describeUrl(url: string): Promise<UrlDescription> {
  const cached = await cache.get(url);
  if (cached) return cached;
  const { provider = '', contentType } = detectLinkProvider(url);
  const og = await fetchOpenGraph(url);
  const description: UrlDescription = {
    url,
    title: og.title,
    description: og.description,
    siteName: og.siteName,
    domain: og.domain,
    favicon: og.favicon,
    thumbnail: og.thumbnail,
    thumbnailWidth: og.thumbnailWidth,
    thumbnailHeight: og.thumbnailHeight,
    provider,
    contentType: contentType ?? null,
  };
  await cache.set(url, description);
  return description;
}

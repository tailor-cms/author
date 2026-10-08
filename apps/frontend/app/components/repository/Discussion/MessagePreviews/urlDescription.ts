import type { UrlDescription } from '@tailor-cms/api-client';

import { repositoryAsset } from '@/api';

// A link pasted into several messages is looked up once. A failed lookup
// is dropped, so the next preview that needs it asks again
const descriptions = new Map<string, Promise<UrlDescription | null>>();

export const describeUrl = (repositoryId: number, url: string) => {
  const key = `${repositoryId}:${url}`;
  const cached = descriptions.get(key);
  if (cached) return cached;
  const lookup = repositoryAsset.describeUrl(repositoryId, url).catch(() => {
    descriptions.delete(key);
    return null;
  });
  descriptions.set(key, lookup);
  return lookup;
};

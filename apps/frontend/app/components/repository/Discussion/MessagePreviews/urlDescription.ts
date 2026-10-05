import type { UrlDescription } from '@tailor-cms/api-client';

import { repositoryAsset } from '@/api';

const descriptions = new Map<string, Promise<UrlDescription | null>>();

export const describeUrl = (repositoryId: number, url: string) => {
  const key = `${repositoryId}:${url}`;
  const cached = descriptions.get(key);
  if (cached) return cached;
  const pending = repositoryAsset
    .describeUrl(repositoryId, url)
    .catch(() => null);
  descriptions.set(key, pending);
  return pending;
};

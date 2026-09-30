import { repositoryAsset } from '@/api';

export interface UrlDescription {
  url: string;
  title: string;
  description: string;
  siteName: string;
  domain: string;
  favicon: string;
  thumbnail: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  provider: string;
  contentType: string | null;
}

const descriptions = new Map<string, Promise<UrlDescription | null>>();

const fetchPreview = (repositoryId: number, url: string) =>
  repositoryAsset
    .describeUrl(repositoryId, url)
    .catch(() => null) as Promise<UrlDescription | null>;

export const useUrlDescription = () => {
  const resolve = (
    repositoryId: number,
    url: string,
  ): Promise<UrlDescription | null> => {
    const key = `${repositoryId}:${url}`;
    const cached = descriptions.get(key);
    if (cached) return cached;
    const pending = fetchPreview(repositoryId, url);
    descriptions.set(key, pending);
    return pending;
  };
  return { resolve };
};

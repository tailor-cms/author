import type { ContentType } from '@tailor-cms/interfaces/discovery.ts';

export {
  ContentFilter,
  ContentType,
  CONTENT_TYPES,
  type DiscoveryResult,
} from '@tailor-cms/interfaces/discovery.ts';

// Thrown when a search provider rejects with a quota/rate-limit error.
export class QuotaExceededError extends Error {
  constructor(provider: string) {
    super(`${provider} quota exceeded`);
    this.name = 'QuotaExceededError';
  }
}

// Internal pipeline type - not exposed to frontend
export interface SearchResult {
  // Result category - set by each search provider mapper
  type: ContentType;
  url: string;
  title: string;
  thumbnailUrl?: string;
  // Full description text (e.g. from Unsplash)
  description?: string;
  // Search provider that returned this result (e.g. 'google', 'unsplash')
  source: string;
  // Brief description or extract from the resource content
  snippet: string;
  // Direct file URL for downloadable content (e.g. image binary, PDF)
  downloadUrl?: string;
  tags?: string[];
  author?: string;
  license?: string;
  imageUrl?: string;
  altText?: string;
}

export type {
  ContentFilter,
  ContentType,
  DiscoveryResult,
} from '@tailor-cms/interfaces/discovery.ts';

import type { ContentType } from '@tailor-cms/interfaces/discovery.ts';

// Internal pipeline type — not exposed to frontend
export interface SearchResult {
  title: string;
  url: string;
  // Search provider that returned this result (e.g. 'google', 'unsplash', 'llm-web-search')
  source: string;
  // Brief description or extract from the resource content
  snippet: string;
  // Result category — set by each search provider mapper
  type: ContentType;
  date?: string;
  year?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  citedBy?: number;
  authors?: string;
}

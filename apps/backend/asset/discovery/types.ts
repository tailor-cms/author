export type {
  ContentFilter,
  ContentType,
  DiscoveryResult,
} from '@tailor-cms/interfaces/discovery.ts';

import type { ContentType } from '@tailor-cms/interfaces/discovery.ts';

/** Truncate a string to max length, coercing nullish to empty. */
export function truncate(value: unknown, max: number): string {
  return String(value || '').slice(0, max);
}

/** Max lengths for SearchResult fields. */
export const MAX_TITLE = 500;
export const MAX_SNIPPET = 1000;

// Internal pipeline type — not exposed to frontend
export interface SearchResult {
  title: string;
  url: string;
  /** Search provider that returned this result (e.g. 'google', 'unsplash') */
  source: string;
  /** Brief description or extract from the resource content */
  snippet: string;
  /** Result category — set by each search provider mapper */
  type: ContentType;
  thumbnailUrl?: string;
  imageUrl?: string;
}

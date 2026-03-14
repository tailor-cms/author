// Category of a discovery result
export type ContentType = 'article' | 'pdf' | 'image' | 'research' | 'data' | 'other';

// UI filter - 'all' plus any content type
export type ContentFilter = 'all' | ContentType;

export interface DiscoveryResult {
  title: string;
  url: string;
  // Brief description or extract from the resource content
  snippet: string;
  type: ContentType;
  // Short note explaining why this result is relevant to the query
  relevanceNote?: string;
  thumbnailUrl?: string;
}

// Category of a discovery result
export const ContentType = {
  Article: 'article',
  Pdf: 'pdf',
  Image: 'image',
  Video: 'video',
  Research: 'research',
  Other: 'other',
} as const;
export type ContentType = typeof ContentType[keyof typeof ContentType];
export const CONTENT_TYPES = Object.values(ContentType);

// UI filter - 'all' plus any content type
export const ContentFilter = { All: 'all', ...ContentType } as const;
export type ContentFilter = typeof ContentFilter[keyof typeof ContentFilter];

export interface DiscoveryResult {
  title: string;
  url: string;
  // Brief description or extract from the resource content
  snippet: string;
  type: ContentType;
  // Short note explaining why this result is relevant to the query
  relevanceNote?: string;
  thumbnailUrl?: string;
  // Direct file URL for downloadable content (e.g. image binary, PDF)
  downloadUrl?: string;
  author?: string;
  license?: string;
  // Full description from source (e.g. Unsplash photo description)
  description?: string;
  // Tags/keywords from source
  tags?: string[];
  altText?: string;
}

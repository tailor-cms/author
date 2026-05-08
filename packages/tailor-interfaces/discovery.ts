// Category of a discovery result
export const ContentType = {
  Article: 'ARTICLE',
  Pdf: 'PDF',
  Image: 'IMAGE',
  Video: 'VIDEO',
  Research: 'RESEARCH',
  Other: 'OTHER',
} as const;
export type ContentType = typeof ContentType[keyof typeof ContentType];
export const CONTENT_TYPES = Object.values(ContentType);

// UI filter - 'all' plus any content type
export const ContentFilter = { All: 'ALL', ...ContentType } as const;
export type ContentFilter = typeof ContentFilter[keyof typeof ContentFilter];

export interface DiscoveryResult {
  type: ContentType;
  url: string;
  title: string;
  snippet: string;
  // Search provider that returned this result (e.g. 'google', 'unsplash')
  source: string;
  thumbnailUrl?: string;
  // Direct file URL for downloadable content (e.g. image binary, PDF)
  downloadUrl?: string;
  // Full description from source (e.g. Unsplash photo description)
  description?: string;
  tags?: string[];
  author?: string;
  license?: string;
  altText?: string;
}

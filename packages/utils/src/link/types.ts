import type { LinkContentType } from '@tailor-cms/interfaces/asset';

export interface LinkEmbed {
  kind: typeof LinkContentType.Video | typeof LinkContentType.Document;
  embedUrl: string;
  thumbnailUrl: string;
}

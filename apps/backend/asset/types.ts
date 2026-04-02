import type { AssetSource } from '@tailor-cms/interfaces/asset.ts';
import type { ContentType } from '@tailor-cms/interfaces/discovery.ts';
import type { RequestHandler } from 'express';
import type { Asset } from './asset.model.js';

export type { AssetSource };

export interface MulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ImportFileOptions {
  repositoryId: number;
  userId: number;
  file: MulterFile;
  description?: string;
  tags?: string[];
  source?: AssetSource;
}

// Controls how video-provider links (YouTube, Vimeo) are classified
// in list queries
export const VideoLinkMode = {
  // Show video-provider links under the video filter
  Include: 'include',
  // Hide video-provider links from the link filter
  Exclude: 'exclude',
} as const;

export type VideoLinkMode =
  (typeof VideoLinkMode)[keyof typeof VideoLinkMode];

export interface ListOptions {
  search?: string;
  type?: string | string[];
  offset?: number;
  limit?: number;
  signed?: boolean;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  // How to handle link assets with video provider URLs
  // 'include': merge them into video results (for video filter)
  // 'exclude': remove them from link results (for link filter)
  // undefined: no special handling (default)
  videoLinkMode?: VideoLinkMode;
}

export interface ImportFromLinkOptions {
  // Discovery content type (video, image, pdf, article)
  // Determines import strategy (download vs link)
  contentType?: ContentType;
  // Known provider slug (youtube, vimeo, spotify)
  // Auto-detected from URL if not provided
  provider?: string;
  title?: string;
  description?: string;
  downloadUrl?: string;
  altText?: string;
  author?: string;
  license?: string;
  tags?: string[];
}

/**
 * Properties available on the Express Request after middleware injection.
 * Intentionally not extending Express.Request to avoid type conflicts
 * with built-in properties (files, user). Controllers destructure only
 * the properties they need; the `handler` cast bridges the type gap
 * for router registration.
 */
export interface AssetRequest {
  repository: any;
  user: any;
  asset?: Asset;
  body: any;
  query: any;
  parsedQuery?: Record<string, any>;
  options: { limit: number; offset: number; order?: any[] };
  // Single file from upload.single() (attachFile route)
  file?: MulterFile;
  // Grouped files from upload.fields(); keyed by field name
  files?: Record<string, MulterFile[]>;
}

// Narrowed request for :assetId routes where getAsset middleware
// guarantees asset is present
export type AssetItemRequest = AssetRequest & { asset: Asset };

type AsyncHandler = (req: AssetRequest | AssetItemRequest, res: any) => Promise<any>;

// Bridges AssetRequest handlers to Express RequestHandler via type cast.
// Controllers use AssetRequest (with injected repository, asset, etc.)
// but Express routers expect standard RequestHandler. This cast is safe
// because middleware (repository loader, getAsset, multer, pagination)
// populates the required properties before the handler runs.
export const handler = (fn: AsyncHandler) => fn as unknown as RequestHandler;

// Service-internal types for the Asset slice. Wire shapes for HTTP
// endpoints live in `./schemas/*.ts`; this file only carries what the
// service / utilities pass to each other without a wire counterpart.
import type { ImageDimensions } from './utils/image.ts';
import type { AssetSource } from './schemas/entity.ts';

// A file whose bytes the server holds entirely in memory (in a Buffer), rather
// than streaming through to storage. Produced for link/remote downloads
// (`downloadFile`), AI-generated images, and small attachments (captions).
export interface BufferedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

// A file already persisted to storage, ready to be recorded as an Asset. The
// streaming multer engine produces this shape.
export interface StoredFile {
  uid: string;
  key: string;
  originalname: string;
  mimetype: string;
  size: number;
  dimensions?: ImageDimensions | null;
}

// Optional attribution (description, source, tags) attached when creating an
// asset record. Carried by `ImportFileOptions`
export interface AssetAttribution {
  description?: string;
  source?: AssetSource;
  tags?: string[];
}

// Parameters for the `importBufferedFile()` service helper.
export interface ImportFileOptions extends AssetAttribution {
  repositoryId: number;
  userId: number;
  file: BufferedFile;
}

// Resolved signed asset URLs
export interface ResolvedStorageKey {
  // Signed URL of the original file.
  publicUrl: string | null;
  // Signed URL of the thumbnail; null when the asset has no image
  // representation to build one from (audio, documents), or while a first
  // one is still generating in the background.
  thumbnailUrl: string | null;
  // Backing library asset id.
  assetId: number;
}

// Controls how video-provider links (YouTube, Vimeo, ...) are classified
// in list queries. Set by the `ListFilter` Zod transform; consumed by the
// service to add the right Sequelize WHERE fragment.
export const VideoLinkMode = {
  // Show video-provider links under the video filter.
  Include: 'include',
  // Hide video-provider links from the link filter.
  Exclude: 'exclude',
} as const;

export type VideoLinkMode =
  (typeof VideoLinkMode)[keyof typeof VideoLinkMode];

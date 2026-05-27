// Service-internal types for the Asset slice. Wire shapes for HTTP
// endpoints live in `./schemas/*.ts`; this file only carries what the
// service / utilities pass to each other without a wire counterpart.
import type { AssetSource } from './schemas/entity.ts';

// Multer (memoryStorage) file payload
export interface MulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Parameters for the service-internal `importFile()` helper.
export interface ImportFileOptions {
  repositoryId: number;
  userId: number;
  file: MulterFile;
  description?: string;
  tags?: string[];
  source?: AssetSource;
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

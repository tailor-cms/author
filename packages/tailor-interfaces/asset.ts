export const AssetType = {
  Image: 'image',
  Document: 'document',
  Video: 'video',
  Audio: 'audio',
  Link: 'link',
  Other: 'other',
} as const;

export type AssetType = (typeof AssetType)[keyof typeof AssetType];

export const ProcessingStatus = {
  Pending: 'pending',
  Processing: 'processing',
  Completed: 'completed',
  Failed: 'failed',
} as const;

export type ProcessingStatus =
  (typeof ProcessingStatus)[keyof typeof ProcessingStatus];

interface AssetMetaBase {
  description?: string;
  tags?: string[];
  files?: Record<string, string>;
  // Marks this asset as a primary knowledge source for content generation
  isCoreSource?: boolean;
}

export interface FileAssetMeta extends AssetMetaBase {
  fileSize: number;
  mimeType: string;
  // File extension without dot (e.g. 'jpg', 'pdf')
  extension?: string;
  // Image width in pixels (extracted on upload)
  width?: number;
  // Image height in pixels (extracted on upload)
  height?: number;
  source?: AssetSource;
}

export interface MediaAssetMeta extends FileAssetMeta {
  files?: Record<string, string> & { captions?: string };
}

export interface LinkAssetMeta extends AssetMetaBase {
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  favicon: string;
  domain: string;
  siteName?: string;
  ogType?: string;
  source?: AssetSource;
  // What kind of content the link points to (video, image, document, etc.)
  contentType?: 'video' | 'image' | 'document' | 'audio' | 'article' | 'other';
  // Known provider for provider-specific UI (youtube, vimeo, spotify, etc.)
  provider?: string;
}

export type AssetMeta = FileAssetMeta | MediaAssetMeta | LinkAssetMeta;

export interface AssetSource {
  url: string;
  domain: string;
  title?: string;
  author?: string;
  license?: string;
}

export interface Uploader {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  imgUrl: string | null;
}

const ASSET_TYPE_EXTENSIONS: Record<string, Set<string>> = {
  image: new Set([
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'avif',
  ]),
  document: new Set(['pdf', 'doc', 'docx', 'pptx', 'txt', 'md', 'html']),
  video: new Set(['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv']),
  audio: new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma']),
};

export function inferAssetType(extensions: string[]): AssetType | null {
  if (!extensions.length) return null;
  const cleaned = extensions.map((e) => e.replace(/^\./, '').toLowerCase());
  for (const [type, exts] of Object.entries(ASSET_TYPE_EXTENSIONS)) {
    if (cleaned.every((e) => exts.has(e))) return type as AssetType;
  }
  return null;
}

export interface Asset {
  id: number;
  uid: string;
  repositoryId: number;
  name: string;
  type: AssetType;
  storageKey: string | null;
  publicUrl?: string;
  meta: AssetMeta;
  processingStatus: ProcessingStatus | null;
  vectorStoreFileId: string | null;
  uploadedBy: number;
  uploader?: Uploader;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

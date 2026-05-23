export const AssetType = {
  Image: 'IMAGE',
  Document: 'DOCUMENT',
  Video: 'VIDEO',
  Audio: 'AUDIO',
  Link: 'LINK',
  Other: 'OTHER',
} as const;

export type AssetType = (typeof AssetType)[keyof typeof AssetType];

export const LinkContentType = {
  Video: 'VIDEO',
  Image: 'IMAGE',
  Document: 'DOCUMENT',
  Audio: 'AUDIO',
  Article: 'ARTICLE',
  Other: 'OTHER',
} as const;

export type LinkContentType =
  (typeof LinkContentType)[keyof typeof LinkContentType];

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
  contentType?: LinkContentType;
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
  label: string;
  imgUrl: string | null;
}

const ASSET_TYPE_EXTENSIONS: Record<string, Set<string>> = {
  [AssetType.Image]: new Set([
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'avif',
  ]),
  [AssetType.Document]: new Set(['pdf', 'doc', 'docx', 'pptx', 'txt', 'md', 'html']),
  [AssetType.Video]: new Set(['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv']),
  [AssetType.Audio]: new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma']),
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
  uploaderId: number;
  uploader?: Uploader;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Discriminated unions narrowing Asset by type
export interface FileAsset extends Asset {
  type: 'IMAGE' | 'DOCUMENT' | 'OTHER';
  storageKey: string;
  meta: FileAssetMeta;
}

export interface MediaAsset extends Asset {
  type: 'VIDEO' | 'AUDIO';
  storageKey: string;
  meta: MediaAssetMeta;
}

export interface LinkAsset extends Asset {
  type: 'LINK';
  storageKey: null;
  meta: LinkAssetMeta;
}

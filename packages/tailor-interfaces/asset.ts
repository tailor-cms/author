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
  Research: 'RESEARCH',
  Other: 'OTHER',
} as const;

export type LinkContentType =
  (typeof LinkContentType)[keyof typeof LinkContentType];

// Services a link can belong to
export const LinkProvider = {
  YouTube: 'youtube',
  Vimeo: 'vimeo',
  Dailymotion: 'dailymotion',
  Loom: 'loom',
  Spotify: 'spotify',
  SoundCloud: 'soundcloud',
  GoogleDocs: 'google-docs',
  GoogleSheets: 'google-sheets',
  GoogleSlides: 'google-slides',
  GoogleForms: 'google-forms',
  GoogleDrive: 'google-drive',
  MicrosoftWord: 'microsoft-word',
  MicrosoftExcel: 'microsoft-excel',
  MicrosoftPowerPoint: 'microsoft-powerpoint',
  OneDrive: 'onedrive',
  SharePoint: 'sharepoint',
} as const;

export type LinkProvider = (typeof LinkProvider)[keyof typeof LinkProvider];

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
  // A cached thumbnail has been generated (grid/list fast path). Any asset
  // type can have one.
  hasThumbnail?: boolean;
  // Thumbnail generation failed; don't retry, fall back instead
  thumbnailFailed?: boolean;
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
  // The service behind the link, when it is one we recognise
  provider?: LinkProvider;
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
  [AssetType.Document]: new Set([
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'rtf', 'txt',
    'md', 'html',
  ]),
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
  thumbnailUrl?: string;
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

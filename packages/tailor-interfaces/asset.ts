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
}

export interface FileAssetMeta extends AssetMetaBase {
  fileSize: number;
  mimeType: string;
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

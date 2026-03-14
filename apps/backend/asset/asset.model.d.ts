import type { Model, ModelStatic } from 'sequelize';
import { AssetType, ProcessingStatus } from '@tailor-cms/interfaces/asset.ts';

export { AssetType, ProcessingStatus };

interface AssetMetaBase {
  description?: string;
  tags?: string[];
}

export interface FileAssetMeta extends AssetMetaBase {
  fileSize: number;
  mimeType: string;
}

export interface MediaAssetMeta extends FileAssetMeta {
  /** Storage key for an uploaded caption/subtitle file (.vtt, .srt) */
  captionKey?: string;
}

export interface LinkAssetMeta extends AssetMetaBase {
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  favicon: string;
  domain: string;
  siteName?: string;
  /** Open Graph type (og:type) - e.g. "website", "article", "video.movie" */
  ogType?: string;
}

export interface Uploader {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  imgUrl: string | null;
}

export type AssetMeta = FileAssetMeta | MediaAssetMeta | LinkAssetMeta;

interface AssetAttributes {
  id: number;
  uid: string;
  repositoryId: number;
  name: string;
  type: AssetType;
  storageKey: string | null;
  meta: AssetMeta;
  processingStatus: ProcessingStatus | null;
  vectorStoreFileId: string | null;
  uploadedBy: number;
  uploader?: Uploader;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

type AssetBase = AssetAttributes & Model<AssetAttributes>;

export interface FileAsset extends AssetBase {
  type: 'image' | 'document' | 'other';
  storageKey: string;
  meta: FileAssetMeta;
}

export interface MediaAsset extends AssetBase {
  type: 'video' | 'audio';
  storageKey: string;
  meta: MediaAssetMeta;
}

export interface LinkAsset extends AssetBase {
  type: 'link';
  storageKey: null;
  meta: LinkAssetMeta;
}

export type Asset = FileAsset | MediaAsset | LinkAsset;

declare const Asset: ModelStatic<Asset>;
export default Asset;

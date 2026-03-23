import type { Model, ModelStatic } from 'sequelize';
import type {
  Asset as AssetAttributes,
  FileAssetMeta,
  LinkAssetMeta,
  MediaAssetMeta,
} from '@tailor-cms/interfaces/asset.ts';

export type {
  AssetAttributes,
  FileAssetMeta,
  LinkAssetMeta,
  MediaAssetMeta,
};
export {
  AssetMeta,
  AssetType,
  ProcessingStatus,
  Uploader,
} from '@tailor-cms/interfaces/asset.ts';

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

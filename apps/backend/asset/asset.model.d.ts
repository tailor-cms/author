import type { Model, ModelStatic } from 'sequelize';
import type { Asset as AssetAttributes } from '@tailor-cms/interfaces/asset.ts';

export type { AssetAttributes };
export {
  AssetMeta,
  AssetType,
  FileAssetMeta,
  LinkAssetMeta,
  MediaAssetMeta,
  ProcessingStatus,
  Uploader,
} from '@tailor-cms/interfaces/asset.ts';

type AssetBase = AssetAttributes & Model<AssetAttributes>;

export interface FileAsset extends AssetBase {
  type: 'IMAGE' | 'DOCUMENT' | 'OTHER';
  storageKey: string;
  meta: FileAssetMeta;
}

export interface MediaAsset extends AssetBase {
  type: 'VIDEO' | 'AUDIO';
  storageKey: string;
  meta: MediaAssetMeta;
}

export interface LinkAsset extends AssetBase {
  type: 'LINK';
  storageKey: null;
  meta: LinkAssetMeta;
}

export type Asset = FileAsset | MediaAsset | LinkAsset;

declare const Asset: ModelStatic<Asset>;
export default Asset;

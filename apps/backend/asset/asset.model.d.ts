import type { Model, ModelStatic } from 'sequelize';
import type {
  Asset as AssetAttributes,
  FileAsset as FileAssetAttrs,
  LinkAsset as LinkAssetAttrs,
  MediaAsset as MediaAssetAttrs,
} from '@tailor-cms/interfaces/asset.ts';

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

// Sequelize model variants of the interface discriminated unions
export type FileAsset = FileAssetAttrs & Model<AssetAttributes>;
export type MediaAsset = MediaAssetAttrs & Model<AssetAttributes>;
export type LinkAsset = LinkAssetAttrs & Model<AssetAttributes>;
export type Asset = FileAsset | MediaAsset | LinkAsset;

declare const Asset: ModelStatic<Asset>;
export default Asset;

import { AssetType } from '@tailor-cms/interfaces/asset';

export const ASSET_TYPE_ICON: Record<string, string> = {
  [AssetType.Image]: 'mdi-image-outline',
  [AssetType.Video]: 'mdi-video-outline',
  [AssetType.Audio]: 'mdi-volume-medium',
  [AssetType.Document]: 'mdi-file-document-outline',
  [AssetType.Link]: 'mdi-link',
  [AssetType.Other]: 'mdi-file-outline',
};

export const ASSET_TYPE_LABEL: Record<string, string> = {
  [AssetType.Image]: 'Image',
  [AssetType.Video]: 'Video',
  [AssetType.Audio]: 'Audio',
  [AssetType.Document]: 'Document',
  [AssetType.Link]: 'Link',
  [AssetType.Other]: 'File',
};

// Whole sentences per type; grammar (articles, mass nouns) lives here, not
// in code, so it stays translatable.
export const ASSET_TYPE_DROPZONE_TITLE: Record<string, string> = {
  [AssetType.Image]: 'Add an image',
  [AssetType.Video]: 'Add a video',
  [AssetType.Audio]: 'Add audio',
  [AssetType.Document]: 'Add a document',
  [AssetType.Link]: 'Add a link',
  [AssetType.Other]: 'Add a file',
};

export const ASSET_TYPE_COLOR: Record<string, string> = {
  [AssetType.Image]: 'asset-image',
  [AssetType.Video]: 'asset-video',
  [AssetType.Audio]: 'asset-audio',
  [AssetType.Document]: 'asset-document',
  [AssetType.Link]: 'asset-link',
  [AssetType.Other]: 'asset-other',
};

import { AssetType } from '@tailor-cms/interfaces/asset';

export const ASSET_TYPE_ICON: Record<string, string> = {
  [AssetType.Image]: 'mdi-image-outline',
  [AssetType.Video]: 'mdi-video-outline',
  [AssetType.Audio]: 'mdi-volume-medium',
  [AssetType.Document]: 'mdi-file-document-outline',
  [AssetType.Link]: 'mdi-link',
  [AssetType.Other]: 'mdi-file',
};

export const ASSET_TYPE_LABEL: Record<string, string> = {
  [AssetType.Image]: 'Image',
  [AssetType.Video]: 'Video',
  [AssetType.Audio]: 'Audio',
  [AssetType.Document]: 'Document',
  [AssetType.Link]: 'Link',
  [AssetType.Other]: 'File',
};

export const ASSET_TYPE_COLOR: Record<string, string> = {
  [AssetType.Image]: 'red',
  [AssetType.Video]: 'lime',
  [AssetType.Audio]: 'lime',
  [AssetType.Document]: 'blue',
  [AssetType.Link]: 'primary',
  [AssetType.Other]: 'primary',
};

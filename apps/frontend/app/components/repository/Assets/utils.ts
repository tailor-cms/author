import type { AssetType } from '@tailor-cms/interfaces/asset.ts';

export type AssetCategory = AssetType;

const ICON_MAP: Record<string, string> = {
  image: 'mdi-file-image',
  video: 'mdi-file-video',
  audio: 'mdi-file-music',
  document: 'mdi-file-document',
  link: 'mdi-link',
  other: 'mdi-file',
};

const COLOR_MAP: Record<string, string> = {
  image: 'blue',
  video: 'purple',
  audio: 'orange',
  document: 'red',
  link: 'cyan',
  other: 'grey',
};

interface AssetLike {
  type?: string;
}

export function getAssetCategory(asset: AssetLike): AssetCategory {
  return (asset.type as AssetCategory) || 'other';
}

export function getAssetIcon(asset: AssetLike) {
  return ICON_MAP[getAssetCategory(asset)] ?? ICON_MAP.other;
}

export function getAssetColor(asset: AssetLike) {
  return COLOR_MAP[getAssetCategory(asset)] ?? COLOR_MAP.other;
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

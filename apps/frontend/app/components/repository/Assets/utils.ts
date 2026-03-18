import { ASSET_TYPE_ICON } from '@tailor-cms/core-components';

export { ASSET_TYPE_ICON, ASSET_TYPE_LABEL, formatFileSize } from '@tailor-cms/core-components';

export const ASSET_TYPE_COLOR: Record<string, string> = {
  image: 'blue',
  video: 'purple',
  audio: 'orange',
  document: 'red',
  link: 'cyan',
  other: 'grey',
};

export function getAssetIcon(asset: { type?: string }) {
  return ASSET_TYPE_ICON[asset.type ?? 'other'] ?? ASSET_TYPE_ICON.other;
}

export function getAssetColor(asset: { type?: string }) {
  return ASSET_TYPE_COLOR[asset.type ?? 'other'] ?? ASSET_TYPE_COLOR.other;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

import { ASSET_TYPE_COLOR, ASSET_TYPE_ICON } from '@tailor-cms/core-components';

export {
  ASSET_TYPE_COLOR,
  ASSET_TYPE_ICON,
  ASSET_TYPE_LABEL,
  formatFileSize,
} from '@tailor-cms/core-components';

const UUID_PREFIX_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}__/i;

function stripUidPrefix(value: string): string {
  return value.replace(UUID_PREFIX_RE, '');
}

export function getAssetDisplayName(asset: {
  name?: string;
  storageKey?: string | null;
}): string {
  if (asset.name) return stripUidPrefix(asset.name);
  if (asset.storageKey) {
    const filename = asset.storageKey.split('/').pop() ?? 'Untitled';
    return stripUidPrefix(filename);
  }
  return 'Untitled';
}

export function getAssetIcon(asset: { type?: string }) {
  return ASSET_TYPE_ICON[asset.type ?? 'other'] ?? ASSET_TYPE_ICON.other;
}

export function getAssetColor(asset: { type?: string }) {
  return ASSET_TYPE_COLOR[asset.type ?? 'other'] ?? ASSET_TYPE_COLOR.other;
}

const ALWAYS_INDEXABLE = new Set(['document', 'link']);
const CAPTION_INDEXABLE = new Set(['video', 'audio']);

export function isIndexable(asset: { type?: string; meta?: any }): boolean {
  if (ALWAYS_INDEXABLE.has(asset.type ?? '')) return true;
  const hasContent = asset.meta?.description || asset.meta?.tags?.length;
  if (hasContent) return true;
  if (CAPTION_INDEXABLE.has(asset.type ?? '')) return !!asset.meta?.files?.captions;
  return false;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

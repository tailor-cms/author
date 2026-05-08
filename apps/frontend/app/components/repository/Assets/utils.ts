import { AssetType } from '@tailor-cms/interfaces/asset';

export {
  formatFileSize,
  getAssetColor,
  getAssetIcon,
  getAssetLabel as getAssetTypeLabel,
} from '@tailor-cms/core-components';

const UUID_PREFIX_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}__/i;

function stripUidPrefix(value: string): string {
  return value.replace(UUID_PREFIX_RE, '');
}

export function getAssetDisplayName(asset: {
  name?: string;
  storageKey?: string | null;
} | null): string {
  if (!asset) return '';
  if (asset.name) return asset.name;
  if (asset.storageKey) {
    const filename = asset.storageKey.split('/').pop() ?? 'Untitled';
    return stripUidPrefix(filename);
  }
  return 'Untitled';
}

const ALWAYS_INDEXABLE = new Set<string>([
  AssetType.Document,
  AssetType.Link,
]);
const CAPTION_INDEXABLE = new Set<string>([
  AssetType.Video,
  AssetType.Audio,
]);

export function isIndexable(
  asset: { type?: string; meta?: any },
): boolean {
  if (ALWAYS_INDEXABLE.has(asset.type ?? '')) return true;
  const hasContent =
    asset.meta?.description || asset.meta?.tags?.length;
  if (hasContent) return true;
  if (CAPTION_INDEXABLE.has(asset.type ?? '')) {
    return !!asset.meta?.files?.captions;
  }
  return false;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

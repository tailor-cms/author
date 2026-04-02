import { AssetType } from '@tailor-cms/interfaces/asset';
import { detectLinkProvider } from '@tailor-cms/common/asset';
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
} | null): string {
  if (!asset) return '';
  if (asset.name) return stripUidPrefix(asset.name);
  if (asset.storageKey) {
    const filename = asset.storageKey.split('/').pop() ?? 'Untitled';
    return stripUidPrefix(filename);
  }
  return 'Untitled';
}

const PROVIDER_ICONS: Record<string, string> = {
  youtube: 'mdi-youtube',
  vimeo: 'mdi-vimeo',
  spotify: 'mdi-spotify',
  soundcloud: 'mdi-soundcloud',
};

const PROVIDER_COLORS: Record<string, string> = {
  youtube: 'red',
  vimeo: 'blue',
  spotify: 'green',
  soundcloud: 'orange',
};

const LINK_CONTENT_TYPE_ICONS: Record<string, string> = {
  [AssetType.Video]: 'mdi-play-circle',
  [AssetType.Audio]: 'mdi-music-circle',
  [AssetType.Image]: 'mdi-image',
  [AssetType.Document]: 'mdi-file-document',
};

export function detectProvider(
  asset: { type?: string; meta?: any },
): string | null {
  if (asset.type !== AssetType.Link) return null;
  if (asset.meta?.provider) return asset.meta.provider;
  const url = asset.meta?.url;
  if (!url) return null;
  return detectLinkProvider(url).provider || null;
}

export function getAssetIcon(asset: { type?: string; meta?: any } | null) {
  if (!asset) return ASSET_TYPE_ICON.other;
  const provider = detectProvider(asset);
  if (provider && PROVIDER_ICONS[provider]) return PROVIDER_ICONS[provider];
  if (asset.type === AssetType.Link && asset.meta) {
    const ct = asset.meta.contentType || asset.meta.linkContentType;
    if (ct && LINK_CONTENT_TYPE_ICONS[ct]) return LINK_CONTENT_TYPE_ICONS[ct];
  }
  return ASSET_TYPE_ICON[asset.type ?? AssetType.Other] ?? ASSET_TYPE_ICON.other;
}

export function getAssetColor(asset: { type?: string; meta?: any } | null) {
  if (!asset) return ASSET_TYPE_COLOR.other;
  const provider = detectProvider(asset);
  if (provider && PROVIDER_COLORS[provider]) return PROVIDER_COLORS[provider];
  return ASSET_TYPE_COLOR[asset.type ?? AssetType.Other] ?? ASSET_TYPE_COLOR.other;
}

export function getAssetTypeLabel(asset: { type?: string; meta?: any }): string {
  const provider = detectProvider(asset);
  if (provider === 'youtube') return 'YouTube Video';
  if (provider === 'vimeo') return 'Vimeo Video';
  if (provider === 'spotify') return 'Spotify';
  if (provider === 'soundcloud') return 'SoundCloud';
  if (asset.type === AssetType.Link && asset.meta) {
    const ct = asset.meta.contentType || asset.meta.linkContentType;
    if (ct === AssetType.Video) return 'Video Link';
    if (ct === AssetType.Audio) return 'Audio Link';
    if (ct === AssetType.Document) return 'Document Link';
  }
  return asset.type || AssetType.Other;
}

const ALWAYS_INDEXABLE = new Set<string>([AssetType.Document, AssetType.Link]);
const CAPTION_INDEXABLE = new Set<string>([AssetType.Video, AssetType.Audio]);

export function isIndexable(asset: { type?: string; meta?: any }): boolean {
  if (ALWAYS_INDEXABLE.has(asset.type ?? '')) return true;
  const hasContent = asset.meta?.description || asset.meta?.tags?.length;
  if (hasContent) return true;
  if (CAPTION_INDEXABLE.has(asset.type ?? '')) {
    return !!asset.meta?.files?.captions;
  }
  return false;
}

export { toEmbedUrl, extractYtVideoId } from '@tailor-cms/common/asset';

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

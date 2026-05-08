import { AssetType } from '@tailor-cms/interfaces/asset';
import { detectLinkProvider } from '@tailor-cms/common/asset';

import {
  ASSET_TYPE_COLOR,
  ASSET_TYPE_ICON,
  ASSET_TYPE_LABEL,
} from '../config/asset';

type AssetLike = { type?: string; meta?: any };

const DEFAULT_ICON = ASSET_TYPE_ICON[AssetType.Other]!;
const DEFAULT_LABEL = ASSET_TYPE_LABEL[AssetType.Other]!;
const DEFAULT_COLOR = ASSET_TYPE_COLOR[AssetType.Other]!;

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

const PROVIDER_LABELS: Record<string, string> = {
  youtube: 'YouTube Video',
  vimeo: 'Vimeo Video',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
};

const LINK_CONTENT_TYPE_ICONS: Record<string, string> = {
  [AssetType.Video]: 'mdi-play-circle',
  [AssetType.Audio]: 'mdi-music-circle',
  [AssetType.Image]: 'mdi-image',
  [AssetType.Document]: 'mdi-file-document',
};

const LINK_CONTENT_TYPE_LABELS: Record<string, string> = {
  [AssetType.Video]: 'Video Link',
  [AssetType.Audio]: 'Audio Link',
  [AssetType.Document]: 'Document Link',
};

function detectProvider(
  asset: AssetLike,
): string | null {
  if (asset.type !== AssetType.Link) return null;
  if (asset.meta?.provider) return asset.meta.provider;
  const url = asset.meta?.url;
  if (!url) return null;
  return detectLinkProvider(url).provider || null;
}

export function getAssetIcon(
  input?: string | AssetLike | null,
): string {
  if (!input) return DEFAULT_ICON;
  if (typeof input === 'string') {
    return ASSET_TYPE_ICON[input] ?? DEFAULT_ICON;
  }
  const provider = detectProvider(input);
  if (provider) return PROVIDER_ICONS[provider] ?? DEFAULT_ICON;
  if (input.type === AssetType.Link && input.meta) {
    const ct = input.meta.contentType || input.meta.linkContentType;
    if (ct) return LINK_CONTENT_TYPE_ICONS[ct] ?? DEFAULT_ICON;
  }
  return ASSET_TYPE_ICON[input.type!] ?? DEFAULT_ICON;
}

export function getAssetColor(
  input?: string | AssetLike | null,
): string {
  if (!input) return DEFAULT_COLOR;
  if (typeof input === 'string') {
    return ASSET_TYPE_COLOR[input] ?? DEFAULT_COLOR;
  }
  const provider = detectProvider(input);
  if (provider) return PROVIDER_COLORS[provider] ?? DEFAULT_COLOR;
  return ASSET_TYPE_COLOR[input.type!] ?? DEFAULT_COLOR;
}

export function getAssetLabel(
  input?: string | AssetLike | null,
): string {
  if (!input) return DEFAULT_LABEL;
  if (typeof input === 'string') {
    return ASSET_TYPE_LABEL[input] ?? DEFAULT_LABEL;
  }
  const provider = detectProvider(input);
  if (provider) return PROVIDER_LABELS[provider] ?? DEFAULT_LABEL;
  if (input.type === AssetType.Link && input.meta) {
    const ct = input.meta.contentType || input.meta.linkContentType;
    if (ct && LINK_CONTENT_TYPE_LABELS[ct]) {
      return LINK_CONTENT_TYPE_LABELS[ct];
    }
  }
  return ASSET_TYPE_LABEL[input.type!] ?? DEFAULT_LABEL;
}

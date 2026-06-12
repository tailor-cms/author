import { AssetType, LinkContentType } from '@tailor-cms/interfaces/asset';
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

// Hardcoded provider colors for link assets
const PROVIDER_COLORS: Record<string, string> = {
  youtube: '#FF0000',
  vimeo: '#1AB7EA',
  spotify: '#1DB954',
  soundcloud: '#FF5500',
};

const PROVIDER_LABELS: Record<string, string> = {
  youtube: 'YouTube Video',
  vimeo: 'Vimeo Video',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
};

const LINK_CONTENT_TYPE_ICONS: Record<string, string> = {
  [LinkContentType.Video]: 'mdi-play-circle',
  [LinkContentType.Image]: 'mdi-image',
  [LinkContentType.Document]: 'mdi-file-document',
  [LinkContentType.Audio]: 'mdi-music-circle',
  [LinkContentType.Article]: 'mdi-newspaper-variant',
  [LinkContentType.Research]: 'mdi-school',
};

const LINK_CONTENT_TYPE_LABELS: Record<string, string> = {
  [LinkContentType.Video]: 'Video Link',
  [LinkContentType.Audio]: 'Audio Link',
  [LinkContentType.Document]: 'Document Link',
  [LinkContentType.Image]: 'Image Link',
  [LinkContentType.Article]: 'Article Link',
  [LinkContentType.Research]: 'Research Link',
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
  if (provider && PROVIDER_ICONS[provider]) return PROVIDER_ICONS[provider];
  if (input.type === AssetType.Link && input.meta) {
    const ct = input.meta.contentType || input.meta.linkContentType;
    if (ct && LINK_CONTENT_TYPE_ICONS[ct]) return LINK_CONTENT_TYPE_ICONS[ct];
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
  if (provider && PROVIDER_COLORS[provider]) return PROVIDER_COLORS[provider];
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
  if (provider && PROVIDER_LABELS[provider]) return PROVIDER_LABELS[provider];
  if (input.type === AssetType.Link && input.meta) {
    const ct = input.meta.contentType || input.meta.linkContentType;
    if (ct && LINK_CONTENT_TYPE_LABELS[ct]) return LINK_CONTENT_TYPE_LABELS[ct];
  }
  return ASSET_TYPE_LABEL[input.type!] ?? DEFAULT_LABEL;
}

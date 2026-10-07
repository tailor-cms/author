import { AssetType, type LinkProvider } from '@tailor-cms/interfaces/asset';
import { detectLinkProvider } from '@tailor-cms/utils';

import {
  ASSET_TYPE_COLOR,
  ASSET_TYPE_ICON,
  ASSET_TYPE_LABEL,
  LINK_CONTENT_TYPE_ICON,
  LINK_CONTENT_TYPE_LABEL,
  LINK_PROVIDER_STYLE,
} from '../config/asset';

type AssetLike = { type?: string; meta?: any };

const DEFAULT_ICON = ASSET_TYPE_ICON[AssetType.Other]!;
const DEFAULT_LABEL = ASSET_TYPE_LABEL[AssetType.Other]!;
const DEFAULT_COLOR = ASSET_TYPE_COLOR[AssetType.Other]!;

const isLink = (asset: AssetLike) => asset.type === AssetType.Link;

function providerStyle(asset: AssetLike) {
  if (!isLink(asset)) return null;
  const provider: LinkProvider | undefined =
    asset.meta?.provider || detectLinkProvider(asset.meta?.url ?? '').provider;
  return provider ? (LINK_PROVIDER_STYLE[provider] ?? null) : null;
}

function linkContentType(asset: AssetLike): string {
  if (!isLink(asset)) return '';
  return asset.meta?.contentType || asset.meta?.linkContentType || '';
}

export function getAssetIcon(
  input?: string | AssetLike | null,
): string {
  if (!input) return DEFAULT_ICON;
  if (typeof input === 'string') {
    return ASSET_TYPE_ICON[input] ?? DEFAULT_ICON;
  }
  return (
    providerStyle(input)?.icon ??
    LINK_CONTENT_TYPE_ICON[linkContentType(input)] ??
    ASSET_TYPE_ICON[input.type!] ??
    DEFAULT_ICON
  );
}

export function getAssetColor(
  input?: string | AssetLike | null,
): string {
  if (!input) return DEFAULT_COLOR;
  if (typeof input === 'string') {
    return ASSET_TYPE_COLOR[input] ?? DEFAULT_COLOR;
  }
  return (
    providerStyle(input)?.color ??
    ASSET_TYPE_COLOR[input.type!] ??
    DEFAULT_COLOR
  );
}

export function getAssetLabel(
  input?: string | AssetLike | null,
): string {
  if (!input) return DEFAULT_LABEL;
  if (typeof input === 'string') {
    return ASSET_TYPE_LABEL[input] ?? DEFAULT_LABEL;
  }
  return (
    providerStyle(input)?.label ??
    LINK_CONTENT_TYPE_LABEL[linkContentType(input)] ??
    ASSET_TYPE_LABEL[input.type!] ??
    DEFAULT_LABEL
  );
}

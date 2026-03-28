// Media element schemas and processing.
// IMAGE, VIDEO, and EMBED packages have no AI specs -
// they're simple media containers. Schemas here use
// assetId to map vector store asset references to
// elements. processMediaElement then resolves assetId
// → native element data (storage:// URLs, alt text,
// embed transforms).
import type { AssetReference } from '@tailor-cms/interfaces/ai.ts';
import { AssetType, LinkContentType } from '@tailor-cms/interfaces/asset.ts';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { oneLine } from 'common-tags';
import { toEmbedUrl } from '@tailor-cms/common/asset';

import { createAiLogger } from '../../logger.ts';

const logger = createAiLogger('cc-structured-content');

const obj = (properties: any, required: string[]) => ({
  type: 'object' as const,
  properties,
  ...(required.length && { required }),
  additionalProperties: false,
});

// JSON schemas for OpenAI structured output.
// assetId maps to vector store catalog entries;
// processMediaElement resolves to native element data.
export const MEDIA_SCHEMAS: Record<string, any> = {
  [ContentElementType.Image]: obj(
    {
      type: { enum: [ContentElementType.Image] },
      assetId: { type: 'integer' },
      alt: { type: 'string' },
    },
    ['type', 'assetId', 'alt'],
  ),
  [ContentElementType.Video]: obj(
    {
      type: { enum: [ContentElementType.Video] },
      assetId: { type: 'integer' },
    },
    ['type', 'assetId'],
  ),
  [ContentElementType.Embed]: obj(
    {
      type: { enum: [ContentElementType.Embed] },
      assetId: { type: 'integer' },
    },
    ['type', 'assetId'],
  ),
};

export const MEDIA_DESCRIPTIONS: Record<string, string> = {
  [ContentElementType.Image]: oneLine`
    a standalone image element for photos, diagrams.
    NEVER use <img> tags inside HTML.`,
  [ContentElementType.Video]: oneLine`
    a video player for uploaded video files.
    Only for assets marked "→ use as VIDEO".`,
  [ContentElementType.Embed]: oneLine`
    an embedded resource (video, interactive content,
    web page). Only for assets marked "→ use as EMBED".`,
};

// Uses asset.contentType set by detectLinkProvider
// at creation — no URL parsing needed here.
export const isVideoLink = (a: AssetReference) =>
  a.type === AssetType.Link && a.contentType === LinkContentType.Video;

// TODO: Figure out MUX video support
export const isVideoFile = (a: AssetReference) =>
  a.type === AssetType.Video ||
  (a.contentType === LinkContentType.Video && !!a.storageKey);

// Resolve what element type an asset maps to.
// Returns the element type and a display label.
export const resolveAssetElementType = (
  asset: AssetReference,
): { elementType: string; label: string } | null => {
  if (asset.type === AssetType.Image) {
    return {
      elementType: ContentElementType.Image,
      label: 'image',
    };
  }
  if (isVideoFile(asset)) {
    return {
      elementType: ContentElementType.Video,
      label: 'video',
    };
  }
  if (isVideoLink(asset)) {
    return {
      elementType: ContentElementType.Embed,
      label: 'video link',
    };
  }
  return null;
};

// Resolve assetId to its reference from context
const resolveAsset = (assetId: number, assets: AssetReference[]) => {
  const asset = assets.find((a) => a.id === assetId);
  if (!asset) logger.warn({ assetId }, 'Asset not found');
  return asset || null;
};

// Transform media AI output into element data.
// Uses storage:// URLs so Tailor resolves signed URLs.
export const processMediaElement = (el: any, assets: AssetReference[]) => {
  const asset = resolveAsset(el.assetId, assets);
  if (!asset) return null;
  if (el.type === ContentElementType.Image) {
    const url = asset.storageKey
      ? `storage://${asset.storageKey}`
      : asset.publicUrl || asset.url || '';
    const isInternal = !!asset.storageKey;
    return {
      type: ContentElementType.Image,
      data: {
        url: isInternal ? '' : url,
        alt: el.alt || asset.description || '',
        assets: isInternal ? { url } : {},
      },
    };
  }
  if (el.type === ContentElementType.Video) {
    const url = asset.storageKey
      ? `storage://${asset.storageKey}`
      : asset.publicUrl || asset.url || '';
    const isInternal = !!asset.storageKey;
    return {
      type: ContentElementType.Video,
      data: {
        url: isInternal ? '' : url,
        assets: isInternal ? { url } : {},
      },
    };
  }
  if (el.type === ContentElementType.Embed) {
    const url = asset.url || asset.publicUrl || '';
    return {
      type: ContentElementType.Embed,
      data: { url: toEmbedUrl(url) || url, height: 400 },
    };
  }
  return el;
};

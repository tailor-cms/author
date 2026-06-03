// AI schemas + post-processing for asset-backed media elements.
//
// Why this file exists:
// Text-content elements (HTML, QUESTION variants, ACCORDION, etc.)
// expose AI specs via elementRegistry.getAiConfig(type) - the AI
// generates the element's content from scratch. Media elements
// (IMAGE, VIDEO, EMBED) are different: they REFERENCE an existing
// library asset rather than have generated content, so their
// element packages intentionally ship no AI spec. We need a
// schema that lets the AI pick an asset by id - not invent one.
//
// What MEDIA_SCHEMAS does:
// Provides JSON Schema fragments shaped for asset selection:
//   { type: 'IMAGE', assetId: <n>, alt: '...' }
// The AI emits an item that names one of the assets passed in
// context (the asset catalog in the prompt). It does NOT produce
// any URL or storage key.
//
// When they apply:
// getElementsSchema (schema.ts) splices MEDIA_SCHEMAS into the
// anyOf union for an `elements` field ONLY when hasAssets is true
// AND the host's elementConfig doesn't already declare the media
// type. Without assets in context, media elements are not
// generatable - the AI can't reference what isn't catalogued.
//
// What MEDIA_DESCRIPTIONS does:
// The prompt-side counterpart - one-line summaries the prompt
// builder emits under "Available element types" so the AI knows
// when to pick each media kind (e.g. EMBED for video LINKS, VIDEO
// for uploaded video FILES). Without these the AI doesn't know
// the distinction from the schema alone.
//
// What processMediaElement does:
// After the AI returns { type, assetId, ... }, this resolves the
// reference into the actual element data shape Tailor stores:
//   - Internal assets: `data.assets.url = "storage://<key>"`,
//     `data.url = ""` (the read pipeline expands `storage://` to
//     a signed public URL).
//   - External assets (links): `data.url = <publicUrl>` directly.
//   - EMBED specifically: `toEmbedUrl(...)` rewrites video-page
//     URLs (YouTube watch page, Vimeo page) into embeddable form.
import type { AssetReference } from '@tailor-cms/interfaces/ai.ts';
import { AssetType, LinkContentType } from '@tailor-cms/interfaces/asset.ts';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { oneLine } from 'common-tags';
import { toEmbedUrl } from '@tailor-cms/common/asset';

import { createAiLogger } from '../../logger.ts';

const logger = createAiLogger('cc-container');

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

// Uses asset.meta.contentType set by detectLinkProvider
// at creation — no URL parsing needed here.
export const isVideoLink = (a: AssetReference) =>
  a.type === AssetType.Link && a.meta?.contentType === LinkContentType.Video;

// TODO: Figure out MUX video support
export const isVideoFile = (a: AssetReference) =>
  a.type === AssetType.Video ||
  (a.meta?.contentType === LinkContentType.Video && !!a.storageKey);

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
      : asset.publicUrl || asset.meta?.url || '';
    const isInternal = !!asset.storageKey;
    return {
      type: ContentElementType.Image,
      data: {
        url: isInternal ? '' : url,
        alt: el.alt || asset.meta?.description || '',
        assets: isInternal ? { url } : {},
      },
    };
  }
  if (el.type === ContentElementType.Video) {
    const url = asset.storageKey
      ? `storage://${asset.storageKey}`
      : asset.publicUrl || asset.meta?.url || '';
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
    const url = asset.meta?.url || asset.publicUrl || '';
    return {
      type: ContentElementType.Embed,
      data: { url: toEmbedUrl(url) || url, height: 400 },
    };
  }
  return el;
};

import mime from 'mime-types';

import { createLogger } from '#logger';
import { getLinkPreviewUrl } from '@tailor-cms/common/asset';

import { AssetType, type Asset } from './models/asset.model.js';
import { buildThumbnailKey } from './utils/storage-key.ts';
import { downloadFile } from './utils/download.ts';
import { generateThumbnail } from './utils/image.ts';
import Storage from '../repository/storage.ts';

const logger = createLogger('asset:thumbnail');

// A function that loads the source image's bytes when called.
type SourceLoader = () => Promise<Buffer | null>;

/**
 * The remote preview image to build a link asset's thumbnail from. Shared with
 * the frontend tile (getLinkPreviewUrl) so the cached thumbnail matches the
 * client-side fallback. null when the link exposes no preview.
 */
function linkPreviewUrl(asset: Asset): string | null {
  if (asset.type !== AssetType.Link) return null;
  return getLinkPreviewUrl(asset.meta);
}

/**
 * Picks how to load an asset's source image - from a stored image upload, or by
 * downloading a link's preview. Returns that loader, or null when there's no
 * image to build a thumbnail from (audio, documents, links without a preview).
 */
function resolveSourceLoader(asset: Asset): SourceLoader | null {
  if (asset.type === AssetType.Image && asset.storageKey) {
    const key = asset.storageKey;
    return () => Storage.getFile(key);
  }
  const previewUrl = linkPreviewUrl(asset);
  if (previewUrl) return async () => (await downloadFile(previewUrl)).buffer;
  return null;
}

/**
 * The image URL to serve without generating a derivative.
 */
function originalImageUrl(asset: Asset): Promise<string> | null {
  if (asset.type === AssetType.Image && asset.storageKey) {
    return Storage.getFileUrl(asset.storageKey);
  }
  return null;
}

// SVG is resolution-independent - there's nothing to shrink.
function isSvg(asset: Asset): boolean {
  return (
    asset.type === AssetType.Image &&
    asset.meta.mimeType === mime.lookup('svg')
  );
}

/**
 * Cold path: builds the WebP from the loaded source, caches it under
 * `thumbnailKey`, and returns its signed URL. On failure the asset is flagged
 * (so we don't retry on every view) and we fall back to the original image.
 */
async function generateAndCacheThumbnail(
  asset: Asset,
  thumbnailKey: string,
  sourceLoader: SourceLoader,
): Promise<string | null> {
  try {
    const sourceBytes = await sourceLoader();
    if (!sourceBytes) throw new Error('Thumbnail source unavailable');
    const thumbnailBytes = await generateThumbnail(sourceBytes);
    await Storage.saveFile(thumbnailKey, thumbnailBytes, {
      ContentType: 'image/webp',
    });
    await asset.update({ meta: { ...asset.meta, hasThumbnail: true } });
    return Storage.getFileUrl(thumbnailKey);
  } catch (err) {
    logger.warn({ err, assetId: asset.id }, 'Thumbnail generation failed');
    await asset.update({ meta: { ...asset.meta, thumbnailFailed: true } });
    return originalImageUrl(asset);
  }
}

/**
 * Resolves the URL of an asset's thumbnail, lazily generating and
 * caching it on first request. Once made, `meta.hasThumbnail` lets the listing
 * hand out the URL directly (see Asset.resolvePublicUrls) so most views never
 * reach the cold path.
 */
export async function resolveThumbnailUrl(
  asset: Asset,
): Promise<string | null> {
  // SVG is already scalable - nothing to shrink.
  if (isSvg(asset)) return originalImageUrl(asset);
  // No image representation at all (audio, documents, preview-less links) -
  // nothing to serve, so the caller shows a type icon.
  const sourceLoader = resolveSourceLoader(asset);
  if (!sourceLoader) return null;

  const thumbnailKey = buildThumbnailKey(asset.repositoryId, asset.uid);
  // Warm path: generated on a prior request - hand out the cached WebP.
  if (await Storage.fileExists(thumbnailKey)) {
    return Storage.getFileUrl(thumbnailKey);
  }
  // A prior attempt failed on bytes that won't decode better; don't retry.
  if (asset.meta.thumbnailFailed) return originalImageUrl(asset);

  return generateAndCacheThumbnail(asset, thumbnailKey, sourceLoader);
}

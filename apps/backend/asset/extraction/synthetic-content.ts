/**
 * Builds synthetic markdown documents from asset metadata.
 *
 * Used by the indexing pipeline to create searchable content for
 * assets that aren't natively text (images, videos, links).
 * Also handles fetching caption text from stored caption files.
 */
import { createLogger } from '#logger';
import { parseCaptions } from './captions.ts';
import Storage from '../../repository/storage.js';

import type { Asset, MediaAssetMeta } from '../asset.model.js';

const logger = createLogger('asset:extraction');

/**
 * Builds a markdown document from asset metadata and optional body text.
 * Returns null when there's nothing meaningful to index (name-only).
 */
export function buildSyntheticContent(
  asset: Asset, bodyText = '',
): string | null {
  const parts: string[] = [`# ${asset.name}`];
  const desc = asset.meta?.description;
  const tags = asset.meta?.tags;
  if (desc) parts.push(`Description: ${desc}`);
  if (tags?.length) parts.push(`Tags: ${tags.join(', ')}`);
  if (bodyText) parts.push(bodyText);
  // Name-only content isn't worth indexing
  return parts.length > 1 ? parts.join('\n\n') : null;
}

/**
 * Reads and parses caption text from a stored caption file (.vtt/.srt).
 * Returns empty string if no captions exist or on failure.
 */
export async function fetchCaptionText(asset: Asset): Promise<string> {
  const captionKey = (asset.meta as MediaAssetMeta)?.captionKey;
  if (!captionKey) return '';
  try {
    const buffer = await Storage.getFile(captionKey);
    if (!buffer) return '';
    return parseCaptions(buffer.toString('utf-8'));
  } catch (err) {
    logger.warn({ err, assetId: asset.id }, 'Failed to read captions');
    return '';
  }
}

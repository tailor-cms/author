/**
 * Builds synthetic markdown documents from asset metadata.
 *
 * Used by the indexing pipeline to create searchable content for
 * assets that aren't natively text (images, videos, links).
 */
import type { Asset } from '../asset.model.js';

// Builds a markdown document from asset metadata and optional body text.
// Returns null when there's nothing meaningful to index (name-only).
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

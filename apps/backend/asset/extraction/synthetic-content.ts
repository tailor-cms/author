/**
 * Builds synthetic markdown documents from asset metadata.
 *
 * Used by the indexing pipeline to create searchable content for
 * assets that aren't natively text (images, videos, links).
 */
import type { Asset } from '../asset.model.js';

// Checks whether an asset's description is meaningful content vs noise
// (duplicate of name, generic placeholder, bare domain).
export function hasUsefulDescription(asset: Asset): boolean {
  const desc = asset.meta?.description?.trim();
  if (!desc) return false;
  const name = asset.name?.trim().toLowerCase();
  const descLower = desc.toLowerCase();
  // Skip if description is just the asset name
  if (descLower === name) return false;
  // Skip generic placeholders
  if (/^(image from |extracted from )/i.test(desc)) return false;
  // Skip if it's just a domain name
  if (/^[\w.-]+\.\w{2,}$/.test(desc)) return false;
  return true;
}

// Builds a markdown document from asset metadata and optional body text.
// Returns null when there's nothing meaningful to index (name-only).
export function buildSyntheticContent(
  asset: Asset, bodyText = '',
): string | null {
  const parts: string[] = [`# ${asset.name}`];
  const meta = asset.meta as Record<string, any>;
  // Attribution and provenance
  if (meta?.source?.author) parts.push(`Author: ${meta.source.author}`);
  if (meta?.siteName || meta?.domain) {
    parts.push(`Source: ${meta.siteName || meta.domain}`);
  }
  if (meta?.url) parts.push(`URL: ${meta.url}`);
  // Short description - skip when it duplicates bodyText (e.g. images
  // where vision-generated description is passed as both)
  const desc = meta?.description;
  if (desc && desc !== bodyText) parts.push(`Description: ${desc}`);
  // Vision-generated fields (images)
  if (meta?.analysis) parts.push(`Analysis: ${meta.analysis}`);
  if (meta?.contentSuggestion) parts.push(`Suggested use: ${meta.contentSuggestion}`);
  if (meta?.tags?.length) parts.push(`Tags: ${meta.tags.join(', ')}`);
  // Full content (page text, captions, vision description)
  if (bodyText) parts.push(bodyText);
  // Name-only content isn't worth indexing
  return parts.length > 1 ? parts.join('\n\n') : null;
}

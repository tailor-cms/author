/**
 * Builds synthetic markdown documents from asset metadata.
 *
 * Used by the indexing pipeline to create searchable content for
 * assets that aren't natively text (images, videos, links).
 */
import type { Asset } from '../asset.model.js';

// Builds a markdown document from asset metadata
// and optional body text (captions, page content, etc.).
// Asset ID and type are included so the AI can discover
// and reference relevant media via vector store search.
export function buildSyntheticContent(
  asset: Asset, bodyText = '',
): string | null {
  const meta = asset.meta as any;
  const parts: string[] = [`# ${asset.name}`];
  parts.push(`Asset ID: ${asset.id} | Type: ${asset.type}`);
  if (meta?.contentType) {
    parts[1] += ` | Content: ${meta.contentType}`;
  }
  if (meta?.provider) {
    parts[1] += ` | Provider: ${meta.provider}`;
  }
  const desc = meta?.description;
  const tags = meta?.tags;
  if (desc) parts.push(desc);
  if (tags?.length) parts.push(`Tags: ${tags.join(', ')}`);
  if (bodyText) parts.push(bodyText);
  return parts.length > 1 ? parts.join('\n\n') : null;
}

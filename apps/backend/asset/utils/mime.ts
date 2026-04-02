// Resolves a MIME type to an AssetType classification.
import { AssetType } from '@tailor-cms/interfaces/asset.ts';

const MIME_CATEGORY_MAP: Record<string, string[]> = {
  image: ['image/'],
  video: ['video/'],
  audio: ['audio/'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'text/plain',
    'text/csv',
    'text/markdown',
    'text/html',
    'application/rtf',
  ],
};

export function resolveType(mimeType: string | undefined): AssetType {
  if (!mimeType) return AssetType.Other;
  for (const [type, prefixes] of Object.entries(MIME_CATEGORY_MAP)) {
    if (prefixes.some((p) => mimeType.startsWith(p))) {
      return type as AssetType;
    }
  }
  return AssetType.Other;
}

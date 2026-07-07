import omit from 'lodash/omit.js';
import type { AssetMeta } from '../models/asset.model.js';

// Stripped symmetrically on export and import (see shared/transfer).
export const TRANSIENT_META_KEYS = ['hasThumbnail', 'thumbnailFailed'] as const;

/** Returns a copy of asset meta without the transient thumbnail cache flags. */
export function stripTransientAssetMeta<T extends Partial<AssetMeta> | null>(
  meta: T,
): T {
  if (!meta || typeof meta !== 'object') return meta;
  return omit(meta, TRANSIENT_META_KEYS) as T;
}

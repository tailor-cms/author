import { type Asset, AssetType } from '@tailor-cms/interfaces/asset';
import { getLinkPreviewUrl } from '@tailor-cms/common/asset';
import repositoryAsset from '@/api/repositoryAsset';

/**
 * Reactive `<img>` source for an asset grid/list tile, with graceful
 * degradation. Returns `src` (the URL to render, or `null` when the caller
 * should show a type icon) and `onError`, wired to the image's `@error`.
 *
 * Candidates are tried in order; `onError` drops the current one and advances:
 *   1. Warm thumbnail - `asset.thumbnailUrl`, a signed URL to the cached WebP,
 *      present once the backend has generated it. Loads straight from storage.
 *   2. Cold thumbnail - the `/thumbnail` route. The first hit makes the backend
 *      generate + cache the WebP, set meta.hasThumbnail, and 302-redirect to
 *      it; later listings then ship (1) and skip this route.
 *   3. Original - the uploaded file (`publicUrl`) or a link's external preview
 *      (OpenGraph image / YouTube still).
 *   4. `null` - no image representation (audio, docs, preview-less links).
 *
 * Example - freshly uploaded image (cold): the list omits `thumbnailUrl`, so
 * `src` is the /thumbnail route; the <img> hits it, the backend shrinks and
 * caches the WebP and 302-redirects, and the tile renders it. On the next
 * visit the list carries `thumbnailUrl`, so the tile loads the WebP directly.
 */
export function useAssetThumbnail(asset: MaybeRefOrGetter<Asset>) {
  const candidates = computed(() => thumbnailCandidates(toValue(asset)));
  const failed = ref(new Set<string>());
  const src = computed(
    () => candidates.value.find((url) => !failed.value.has(url)) ?? null,
  );
  const onError = () => {
    if (src.value) failed.value = new Set(failed.value).add(src.value);
  };
  // A new asset brings a fresh candidate set; drop the failure record so we
  // start from the best source instead of a carried-over fallback position.
  watch(candidates, () => (failed.value = new Set()));
  return { src, onError };
}

function thumbnailCandidates(asset: Asset): string[] {
  const fallback = fallbackImage(asset);
  // Images always have a generatable thumbnail; links only when a preview
  // exists to build one from.
  if (asset.type !== AssetType.Image && !fallback) return [];
  const thumbnail = asset.thumbnailUrl ?? thumbnailRoute(asset);
  return [thumbnail, fallback].filter(isNonEmpty);
}

// The image to show without a generated thumbnail: an uploaded image's own
// file, or a link's external preview. null when the asset has neither.
function fallbackImage(asset: Asset): string | null {
  if (asset.type === AssetType.Image) return asset.publicUrl ?? null;
  return linkPreview(asset);
}

// External preview for a link asset.
function linkPreview(asset: Asset): string | null {
  if (asset.type !== AssetType.Link) return null;
  return getLinkPreviewUrl(asset.meta);
}

// A URL for an <img> src, not an $api fetch: the browser loads it directly and
// the server builds the thumbnail on first hit, then redirects to it.
function thumbnailRoute(asset: Asset) {
  return repositoryAsset.getThumbnailUrl(asset.repositoryId, asset.id);
}

function isNonEmpty(value: string | undefined | null): value is string {
  return Boolean(value);
}

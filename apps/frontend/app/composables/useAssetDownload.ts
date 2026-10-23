import repositoryAsset from '@/api/repositoryAsset';

interface AssetDownloadSource {
  id: number;
  repositoryId: number;
}

/**
 * Signed URL of an asset's file, fetched once on first use. `download`
 * opens it in a new tab, where the browser shows or saves the file.
 */
export function useAssetDownload(
  asset: MaybeRefOrGetter<AssetDownloadSource>,
) {
  const url = ref<string | null>(null);

  const fetchUrl = async () => {
    if (url.value) return url.value;
    const { repositoryId, id } = toValue(asset);
    const result = await repositoryAsset
      .getDownloadUrl(repositoryId, id)
      .catch(() => null);
    url.value = result?.url ?? null;
    return url.value;
  };

  const download = async () => {
    const href = await fetchUrl();
    if (href) window.open(href, '_blank');
  };

  return { url, fetchUrl, download };
}

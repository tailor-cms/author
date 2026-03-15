import api from '@/api/repositoryAsset';

export function useAssets(repositoryId: Ref<number | undefined>) {
  const assets = ref<any[]>([]);
  const isFetching = ref(true);

  async function fetch() {
    if (!repositoryId.value) return;
    isFetching.value = true;
    const MIN_LOADING_MS = 1000;
    const start = Date.now();
    assets.value = await api.list(repositoryId.value);
    const elapsed = Date.now() - start;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
    }
    isFetching.value = false;
  }

  async function upload(files: File[]) {
    if (!repositoryId.value || !files.length) return;
    const uploaded = await api.upload(repositoryId.value, files);
    assets.value = [...uploaded, ...assets.value];
    return uploaded;
  }

  async function remove(assetId: number) {
    if (!repositoryId.value) return;
    await api.remove(repositoryId.value, assetId);
    assets.value = assets.value.filter((a) => a.id !== assetId);
  }

  async function bulkRemove(ids: number[]) {
    if (!repositoryId.value) return;
    const { deletedIds } = await api.bulkRemove(repositoryId.value, ids);
    const deletedSet = new Set(deletedIds);
    assets.value = assets.value.filter((a) => !deletedSet.has(a.id));
    return deletedIds;
  }

  async function addLink(url: string) {
    if (!repositoryId.value) return;
    const asset = await api.importFromLink(repositoryId.value, url);
    assets.value = [asset, ...assets.value];
    return asset;
  }

  async function getDownloadUrl(assetId: number) {
    if (!repositoryId.value) return;
    return api.getDownloadUrl(repositoryId.value, assetId);
  }

  async function deindex(assetId: number) {
    if (!repositoryId.value) return;
    await api.deindexAsset(repositoryId.value, assetId);
    updateAsset({
      id: assetId,
      processingStatus: null,
      vectorStoreFileId: null,
    });
  }

  // Patch an existing asset in-place by id (e.g. after rename, tag, or status change).
  function updateAsset(updated: any) {
    const idx = assets.value.findIndex((a) => a.id === updated.id);
    if (idx !== -1) assets.value[idx] = { ...assets.value[idx], ...updated };
  }

  // Prepend assets to the list. Used by child components that handle their own
  // upload/import and emit the created assets back via @assets-added.
  function prependAssets(newAssets: any[]) {
    if (!newAssets?.length) return;
    assets.value = [...newAssets, ...assets.value];
  }

  return {
    assets,
    isFetching,
    fetch,
    upload,
    addLink,
    getDownloadUrl,
    remove,
    bulkRemove,
    deindex,
    updateAsset,
    prependAssets,
  };
}

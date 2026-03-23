import type { Asset } from '@tailor-cms/interfaces/asset.ts';
import pMinDelay from 'p-min-delay';

import api from '@/api/repositoryAsset';

const MIN_LOADING_MS = 1000;
export const ITEMS_PER_PAGE = 10;

export function useAssets(repositoryId: Ref<number | undefined>) {
  const assets = ref<Asset[]>([]);
  const total = ref(0);
  const page = ref(1);
  const isFetching = ref(true);

  async function fetch(params: Record<string, any> = {}) {
    if (!repositoryId.value) return;
    isFetching.value = true;
    const promise = api.list(repositoryId.value, {
      offset: (page.value - 1) * ITEMS_PER_PAGE,
      limit: ITEMS_PER_PAGE,
      ...params,
    });
    const result = await pMinDelay(promise, MIN_LOADING_MS);
    assets.value = result.items;
    total.value = result.total;
    isFetching.value = false;
  }

  async function upload(files: File[]) {
    if (!repositoryId.value || !files.length) return;
    return api.upload(repositoryId.value, files);
  }

  async function remove(assetId: number) {
    if (!repositoryId.value) return;
    await api.remove(repositoryId.value, assetId);
  }

  async function bulkRemove(ids: number[]) {
    if (!repositoryId.value) return;
    const { deletedIds } = await api.bulkRemove(repositoryId.value, ids);
    return deletedIds;
  }

  async function addLink(url: string) {
    if (!repositoryId.value) return;
    return api.importFromLink(repositoryId.value, url);
  }

  async function getDownloadUrl(assetId: number) {
    if (!repositoryId.value) return;
    return api.getDownloadUrl(repositoryId.value, assetId);
  }

  async function deindex(assetId: number) {
    if (!repositoryId.value) return;
    await api.deindexAsset(repositoryId.value, assetId);
    update({
      id: assetId,
      processingStatus: null,
      vectorStoreFileId: null,
    });
  }

  function update(updated: Partial<Asset> & { id: number }) {
    const idx = assets.value.findIndex((a) => a.id === updated.id);
    if (idx !== -1) {
      assets.value[idx] = { ...assets.value[idx], ...updated } as Asset;
    }
  }

  const pageCount = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE));

  return {
    assets,
    total,
    page,
    pageCount,
    isFetching,
    fetch,
    upload,
    addLink,
    getDownloadUrl,
    remove,
    bulkRemove,
    deindex,
    update,
  };
}

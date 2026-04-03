import type { Asset } from '@tailor-cms/interfaces/asset.ts';
import pMinDelay from 'p-min-delay';

import api from '@/api/repositoryAsset';

const MIN_LOADING_MS = 1000;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

export function useAssets(repositoryId: Ref<number | undefined>) {
  const assets = ref<Asset[]>([]);
  const total = ref(0);
  const page = ref(1);
  const itemsPerPage = ref(DEFAULT_PAGE_SIZE);
  const isFetching = ref(true);
  const isSaving = ref(false);
  const isBulkRemoving = ref(false);

  async function fetch(params: Record<string, any> = {}) {
    if (!repositoryId.value) return;
    isFetching.value = true;
    try {
      const promise = api.list(repositoryId.value, {
        offset: (page.value - 1) * itemsPerPage.value,
        limit: itemsPerPage.value,
        ...params,
      });
      const result = await pMinDelay(promise, MIN_LOADING_MS);
      assets.value = result.items;
      total.value = result.total;
    } finally {
      isFetching.value = false;
    }
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
    isBulkRemoving.value = true;
    try {
      const { deletedIds } = await api.bulkRemove(
        repositoryId.value, ids,
      );
      return deletedIds;
    } finally {
      isBulkRemoving.value = false;
    }
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
    localUpdate({
      id: assetId,
      processingStatus: null,
      vectorStoreFileId: null,
    });
  }

  async function updateMeta(assetId: number, meta: Record<string, any>) {
    if (!repositoryId.value) return;
    isSaving.value = true;
    try {
      await api.updateMeta(repositoryId.value, assetId, meta);
      const current = assets.value.find((a) => a.id === assetId);
      if (!current) return;
      // Shallow spread; matches backend updateMeta behavior.
      // Intentional: allows null values to clear nested keys.
      localUpdate({ id: assetId, meta: { ...current.meta, ...meta } });
    } finally {
      isSaving.value = false;
    }
  }

  function localUpdate(updated: Partial<Asset> & { id: number }) {
    const idx = assets.value.findIndex((a) => a.id === updated.id);
    if (idx !== -1) {
      assets.value[idx] = { ...assets.value[idx], ...updated } as Asset;
    }
  }

  const pageCount = computed(() =>
    Math.ceil(total.value / itemsPerPage.value),
  );

  return {
    assets,
    total,
    page,
    pageCount,
    itemsPerPage,
    isFetching,
    isSaving,
    isBulkRemoving,
    fetch,
    upload,
    addLink,
    getDownloadUrl,
    remove,
    bulkRemove,
    deindex,
    updateMeta,
  };
}

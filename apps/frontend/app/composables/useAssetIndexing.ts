import type { Asset, ProcessingStatus } from '@tailor-cms/interfaces/asset';
import { useIndexingStore } from '@/stores/indexing';

/**
 * Page-facing adapter over the global indexing store. Provides the list
 * overlay and resume helpers the asset page needs, while delegating the
 * indexing lifecycle (submission + polling) to the store so progress survives
 * navigation and shows in the global IndexingIndicator.
 */
export function useAssetIndexing(repositoryId: Ref<number | undefined>) {
  const store = useIndexingStore();

  const isIndexing = computed(() => store.isIndexingFor(repositoryId.value));

  const settledCount = computed(() =>
    store.settledCountFor(repositoryId.value),
  );

  function startIndexing(assets: Pick<Asset, 'id' | 'name'>[]) {
    if (!repositoryId.value) return Promise.resolve();
    return store.startIndexing(assets, repositoryId.value);
  }

  /**
   * Returns a computed list of assets with live indexing status merged in.
   * Overlays the store's polled processingStatus onto each asset, so the UI
   * reflects real-time progress without re-fetching the full list.
   */
  function withStatus(assets: Ref<Asset[]>) {
    return computed(() =>
      assets.value.map((asset) => {
        const status = store.statusOf(asset.id);
        if (status && status !== asset.processingStatus) {
          return { ...asset, processingStatus: status };
        }
        return asset;
      }),
    );
  }

  // Resume tracking assets that are already mid-indexing
  function resumeIfActive(
    assets: {
      id: number;
      name?: string;
      processingStatus: ProcessingStatus | null;
    }[],
  ) {
    store.resume(assets, repositoryId.value);
  }

  function clearAssetStatus(assetId: number) {
    store.clearStatus(assetId);
  }

  return {
    isIndexing,
    settledCount,
    withStatus,
    startIndexing,
    resumeIfActive,
    clearAssetStatus,
  };
}

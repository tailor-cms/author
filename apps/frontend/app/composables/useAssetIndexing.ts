import type { Asset } from '@tailor-cms/interfaces/asset';
import { ProcessingStatus } from '@tailor-cms/interfaces/asset';

import api from '@/api/repositoryAsset';
import { useRepositoryStore } from '@/stores/repository';

const POLL_INTERVAL = 3000;
const ACTIVE_STATUSES = new Set<ProcessingStatus>([
  ProcessingStatus.Pending,
  ProcessingStatus.Processing,
]);

function isActiveStatus(status: ProcessingStatus | null): status is ProcessingStatus {
  return !!status && ACTIVE_STATUSES.has(status);
}

export function useAssetIndexing(repositoryId: Ref<number | undefined>) {
  const repositoryStore = useRepositoryStore();
  const isIndexing = ref(false);
  const indexingStatusMap = reactive(new Map<number, ProcessingStatus>());

  // Capture the calling scope so we can guard against starting polling
  // after the component has been unmounted (scope deactivated).
  const scope = getCurrentScope();
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let pendingSubmissions = 0;

  async function startIndexing(assetIds: number[]) {
    if (!repositoryId.value) return;
    isIndexing.value = true;
    pendingSubmissions++;
    assetIds.forEach((id) => indexingStatusMap.set(id, ProcessingStatus.Pending));
    await api.indexAssets(repositoryId.value, assetIds);
    pendingSubmissions--;
    if (scope?.active) startPolling();
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(pollStatus, POLL_INTERVAL);
  }

  function stopPolling() {
    if (!pollTimer) return;
    clearInterval(pollTimer);
    pollTimer = null;
  }

  function finishPolling() {
    isIndexing.value = false;
    stopPolling();
    // Refresh repository to pick up vector store ID
    // created during indexing (data.$$.ai.storeId)
    if (repositoryId.value) {
      repositoryStore.get(repositoryId.value);
    }
  }

  async function pollStatus() {
    if (!repositoryId.value) return;
    try {
      const statuses = await api.getIndexingStatus(repositoryId.value);
      for (const s of statuses) {
        indexingStatusMap.set(s.id, s.processingStatus as ProcessingStatus);
      }
      const hasActive = statuses.some((s: any) => isActiveStatus(s.processingStatus));
      if (!hasActive && !pendingSubmissions) finishPolling();
    } catch {
      finishPolling();
    }
  }

  // Resume polling if any fetched assets have an active processing status.
  function resumeIfActive(
    assets: { id: number; processingStatus: ProcessingStatus | null }[],
  ) {
    for (const a of assets) {
      if (!isActiveStatus(a.processingStatus)) continue;
      indexingStatusMap.set(a.id, a.processingStatus);
    }
    if (!indexingStatusMap.size) return;
    isIndexing.value = true;
    startPolling();
  }

  function clearAssetStatus(assetId: number) {
    indexingStatusMap.delete(assetId);
  }

  /**
   * Returns a computed list of assets with live indexing status merged in.
   * Overlays polled processingStatus from indexingStatusMap onto each asset,
   * so the UI reflects real-time progress without re-fetching the full list.
   */
  function withStatus(assets: Ref<Asset[]>) {
    return computed(() =>
      assets.value.map((asset) => {
        const status = indexingStatusMap.get(asset.id);
        if (status && status !== asset.processingStatus) {
          return { ...asset, processingStatus: status };
        }
        return asset;
      }),
    );
  }

  onScopeDispose(stopPolling);

  return {
    isIndexing,
    indexingStatusMap,
    withStatus,
    startIndexing,
    resumeIfActive,
    clearAssetStatus,
  };
}

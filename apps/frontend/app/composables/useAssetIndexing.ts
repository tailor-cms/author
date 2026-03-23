import type { Asset } from '@tailor-cms/interfaces/asset';
import { ProcessingStatus } from '@tailor-cms/interfaces/asset';

import api from '@/api/repositoryAsset';

const POLL_INTERVAL = 3000;
const ACTIVE_STATUSES = new Set<ProcessingStatus>([
  ProcessingStatus.Pending,
  ProcessingStatus.Processing,
]);

export function useAssetIndexing(repositoryId: Ref<number | undefined>) {
  const isIndexing = ref(false);
  const indexingStatusMap = reactive(new Map<number, ProcessingStatus>());

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
  }

  async function pollStatus() {
    if (!repositoryId.value) return;
    try {
      const statuses = await api.getIndexingStatus(repositoryId.value);
      for (const s of statuses) {
        indexingStatusMap.set(s.id, s.processingStatus as ProcessingStatus);
      }
      const hasActive = statuses.some(
        (s: { processingStatus: ProcessingStatus }) =>
          ACTIVE_STATUSES.has(s.processingStatus),
      );
      if (!hasActive && !pendingSubmissions) finishPolling();
    } catch {
      finishPolling();
    }
  }

  // Resume polling if any fetched assets have an active processing status.
  function resumeIfActive(
    assets: { id: number; processingStatus: ProcessingStatus | null }[],
  ) {
    const active = assets.filter(
      (a): a is typeof a & { processingStatus: ProcessingStatus } =>
        !!a.processingStatus && ACTIVE_STATUSES.has(a.processingStatus),
    );
    if (!active.length) return;
    isIndexing.value = true;
    active.forEach((a) => indexingStatusMap.set(a.id, a.processingStatus));
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
    startIndexing,
    resumeIfActive,
    clearAssetStatus,
    withStatus,
  };
}

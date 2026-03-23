import api from '@/api/repositoryAsset';
import { ProcessingStatus } from '@tailor-cms/interfaces/asset';

const POLL_INTERVAL = 3000;
const ACTIVE_STATUSES: Set<string> = new Set([
  ProcessingStatus.Pending,
  ProcessingStatus.Processing,
]);

export function useAssetIndexing(repositoryId: Ref<number | undefined>) {
  const isIndexing = ref(false);
  const indexingStatusMap = reactive(new Map<number, string>());

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
      for (const s of statuses) indexingStatusMap.set(s.id, s.processingStatus);
      const hasActive = statuses.some(
        (s: { processingStatus: string }) => ACTIVE_STATUSES.has(s.processingStatus),
      );
      if (!hasActive && !pendingSubmissions) finishPolling();
    } catch {
      finishPolling();
    }
  }

  // Resume polling if any fetched assets have an active processing status.
  function resumeIfActive(assets: { id: number; processingStatus: string | null }[]) {
    const active = assets.filter((a) => ACTIVE_STATUSES.has(a.processingStatus));
    if (!active.length) return;
    isIndexing.value = true;
    active.forEach((a) => indexingStatusMap.set(a.id, a.processingStatus));
    startPolling();
  }

  function clearAssetStatus(assetId: number) {
    indexingStatusMap.delete(assetId);
  }

  onScopeDispose(stopPolling);

  return {
    isIndexing,
    indexingStatusMap,
    startIndexing,
    resumeIfActive,
    clearAssetStatus,
  };
}

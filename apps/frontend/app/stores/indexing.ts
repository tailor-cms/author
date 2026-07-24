import { ProcessingStatus } from '@tailor-cms/interfaces/asset';
import { useRepositoryStore } from '@/stores/repository';
import assetApi from '@/api/repositoryAsset';

const POLL_INTERVAL = 3000;
// Give up after this many consecutive status errors;
// so the panel always settles instead of spinning forever.
const MAX_POLL_FAILURES = 3;

const ACTIVE_STATUSES = new Set<ProcessingStatus>([
  ProcessingStatus.Pending,
  ProcessingStatus.Processing,
]);

export function isActiveStatus(
  status: ProcessingStatus | null | undefined,
): status is ProcessingStatus {
  return !!status && ACTIVE_STATUSES.has(status);
}

export interface IndexingItem {
  // Asset id being indexed.
  id: number;
  repositoryId: number;
  name: string;
  status: ProcessingStatus;
  error?: string;
}

// A row from GET /assets/indexing/status
interface StatusRow {
  id: number;
  processingStatus: ProcessingStatus;
}

// Background indexing manager. Owns the polling session and per-item status so
// bulk indexing stays visible in the global indicator even after the user
// navigates away from the asset library.
export const useIndexingStore = defineStore('indexing', () => {
  const repositoryStore = useRepositoryStore();

  // One poll session per repository with in-flight indexing.
  const pollTimers = new Map<number, ReturnType<typeof setInterval>>();
  const items = reactive<IndexingItem[]>([]);

  const itemsFor = (repositoryId?: number) =>
    items.filter((it) => it.repositoryId === repositoryId);

  // Asset ids are globally unique
  const findItem = (id: number) => items.find((it) => it.id === id);

  function upsert(item: IndexingItem) {
    const existing = findItem(item.id);
    if (existing) Object.assign(existing, item);
    else items.push(item);
  }

  function removeItem(id: number) {
    const index = items.findIndex((it) => it.id === id);
    if (index !== -1) items.splice(index, 1);
  }

  // Global view for the indicator panel (spans every repository).
  const activeCount = computed(
    () => items.filter((it) => isActiveStatus(it.status)).length,
  );

  const hasCompleted = computed(() =>
    items.some((it) => !isActiveStatus(it.status)),
  );

  // Per-repository views for the asset page.
  const isIndexingFor = (repositoryId?: number) =>
    itemsFor(repositoryId).some((it) => isActiveStatus(it.status));

  const statusOf = (id: number) => findItem(id)?.status;

  // Settled (completed/failed) count; the page watches it to refetch once
  // indexing lands, so list statuses stay fresh.
  const settledCountFor = (repositoryId?: number) =>
    itemsFor(repositoryId).filter((it) => !isActiveStatus(it.status)).length;

  function applyStatuses(repositoryId: number, statuses: StatusRow[]) {
    const byId = new Map(statuses.map((s) => [s.id, s.processingStatus]));
    itemsFor(repositoryId).forEach((item) => {
      const status = byId.get(item.id);
      if (status) item.status = status;
    });
  }

  function stopPolling(repositoryId: number) {
    const timer = pollTimers.get(repositoryId);
    if (!timer) return;
    clearInterval(timer);
    pollTimers.delete(repositoryId);
    // Indexing may create the repo's vector store (data.$$.ai.storeId);
    // refresh repository in store, so dependent UI picks it up.
    repositoryStore.get(repositoryId);
  }

  function startPolling(repositoryId: number) {
    if (pollTimers.has(repositoryId)) return;
    let failures = 0;
    const poll = async () => {
      try {
        applyStatuses(
          repositoryId,
          await assetApi.getIndexingStatus(repositoryId),
        );
        failures = 0;
        if (!isIndexingFor(repositoryId)) stopPolling(repositoryId);
      } catch {
        if (++failures < MAX_POLL_FAILURES) return;
        itemsFor(repositoryId).forEach((item) => {
          if (!isActiveStatus(item.status)) return;
          item.status = ProcessingStatus.Failed;
          item.error = 'Status check failed';
        });
        stopPolling(repositoryId);
      }
    };
    pollTimers.set(repositoryId, setInterval(poll, POLL_INTERVAL));
  }

  const nameOf = (asset: { id: number; name?: string }) =>
    asset.name || `Asset #${asset.id}`;

  async function startIndexing(
    assets: { id: number; name?: string }[],
    repositoryId: number,
  ) {
    if (!assets.length) return;
    assets.forEach((asset) =>
      upsert({
        id: asset.id,
        repositoryId,
        name: nameOf(asset),
        status: ProcessingStatus.Pending,
      }),
    );
    try {
      const { assetIds } = await assetApi.indexAssets(
        repositoryId,
        assets.map((a) => a.id),
      );
      const queued = new Set(assetIds);
      assets.forEach((asset) => {
        if (!queued.has(asset.id)) removeItem(asset.id);
      });
    } catch {
      // Submission failed: drop the items we optimistically queued.
      assets.forEach((asset) => {
        if (findItem(asset.id)?.status === ProcessingStatus.Pending)
          removeItem(asset.id);
      });
    }
    if (isIndexingFor(repositoryId)) startPolling(repositoryId);
  }

  // Re-adopt assets already mid-indexing (e.g. after a reload) and resume
  // polling so their progress keeps flowing into the indicator.
  function resume(
    assets: {
      id: number;
      name?: string;
      processingStatus: ProcessingStatus | null;
    }[],
    repositoryId?: number,
  ) {
    if (!repositoryId) return;
    assets.forEach((asset) => {
      if (!isActiveStatus(asset.processingStatus)) return;
      upsert({
        id: asset.id,
        repositoryId,
        name: nameOf(asset),
        status: asset.processingStatus,
      });
    });
    if (isIndexingFor(repositoryId)) startPolling(repositoryId);
  }

  function clearStatus(id: number) {
    removeItem(id);
  }

  function clearCompleted() {
    const active = items.filter((it) => isActiveStatus(it.status));
    items.splice(0, items.length, ...active);
  }

  return {
    items,
    activeCount,
    hasCompleted,
    isIndexingFor,
    statusOf,
    settledCountFor,
    startIndexing,
    resume,
    clearStatus,
    clearCompleted,
  };
});

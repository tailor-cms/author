import aiAPI from '@/api/ai';

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 30 * 60 * 1000;
const SIMULATION_TICK = 10000;
const SIMULATION_STEP = 0.02;
const SIMULATION_CAP = 0.8;

export enum Status {
  Idle = 'idle',
  Uploading = 'uploading',
  Indexing = 'indexing',
  Ready = 'ready',
  Failed = 'failed',
  TimedOut = 'timedOut',
}

interface StatusMessage {
  color: string;
  icon: string;
  text: string;
}

interface Emits {
  (event: 'doc:uploaded', value: string): void;
  (event: 'doc:processing', value: boolean): void;
}

export const useDocumentProcessing = (emit: Emits) => {
  const status = ref<Status>(Status.Idle);
  const files = ref<File[]>([]);

  const vectorStoreId = ref<string | null>(null);
  const documents = ref<any[] | null>(null);

  const fileCount = computed(() => documents.value?.length ?? 0);
  const indexedCount = ref(0);
  const simulationProgress = ref(0);

  let progressTimer: ReturnType<typeof setInterval> | null = null;
  let indexingTimer: ReturnType<typeof setInterval> | null = null;

  let indexingStartTime = 0;
  // Incremented on each polling session (and on reset) so in-flight async
  // callbacks from a previous session can detect they are stale and bail out.
  let pollingSessionId = 0;

  const isActive = computed(
    () => status.value === Status.Uploading || status.value === Status.Indexing,
  );

  // Indexing progress percentage (0–99)
  const val = computed(() => {
    if (!fileCount.value) return 0;
    const fileSlot = 100 / fileCount.value;
    const base = (indexedCount.value / fileCount.value) * 100;
    const extra = Math.min(simulationProgress.value, fileSlot * SIMULATION_CAP);
    return Math.min(Math.round(base + extra), 99);
  });

  const label = computed(() => {
    if (![Status.Uploading, Status.Indexing].includes(status.value)) return '';
    if (status.value === Status.Uploading) return 'Uploading documents...';
    return `Indexing documents (${indexedCount.value}/${fileCount.value})`;
  });

  const message = computed<StatusMessage | null>(() => {
    const messages: Partial<Record<Status, StatusMessage>> = {
      [Status.Ready]: {
        color: 'text-success',
        icon: 'mdi-check-circle',
        text: `${documents.value?.length} document(s) indexed`,
      },
      [Status.Failed]: {
        color: 'text-error',
        icon: 'mdi-alert-circle',
        text: 'Indexing failed. Please try again.',
      },
      [Status.TimedOut]: {
        color: 'text-error',
        icon: 'mdi-clock-alert-outline',
        text: 'Indexing timed out. Please try again later.',
      },
    };
    return messages[status.value] ?? null;
  });

  // Derived from reactive state
  watch(isActive, (active) => emit('doc:processing', active));
  watch(vectorStoreId, (id) => id && emit('doc:uploaded', id));

  // Timers
  const stopTimers = () => {
    [indexingTimer, progressTimer].forEach((t) => t && clearInterval(t));
    indexingTimer = progressTimer = null;
  };

  const startSimulation = () => {
    progressTimer = setInterval(() => {
      simulationProgress.value += (100 / fileCount.value) * SIMULATION_STEP;
    }, SIMULATION_TICK);
  };

  const reset = () => {
    stopTimers();
    pollingSessionId++;
    status.value = Status.Idle;
    documents.value = null;
    indexedCount.value = 0;
    simulationProgress.value = 0;
  };

  const finish = (result: Status.Ready | Status.Failed | Status.TimedOut) => {
    stopTimers();
    status.value = result;
    simulationProgress.value = 0;
  };

  const pollIndexingStatus = (storeId: string) => {
    stopTimers();
    indexingStartTime = Date.now();

    const generation = ++pollingSessionId;
    const isStale = () => generation !== pollingSessionId;

    let prevIndexedCount = 0;
    startSimulation();
    indexingTimer = setInterval(async () => {
      if (isStale()) return;
      if (Date.now() - indexingStartTime > POLL_TIMEOUT) return finish(Status.TimedOut);
      try {
        const data = await aiAPI.getVectorStoreStatus(storeId);
        if (isStale()) return;
        indexedCount.value = data.files.filter(
          (f: any) => f.status === 'completed',
        ).length;
        if (indexedCount.value > prevIndexedCount) {
          prevIndexedCount = indexedCount.value;
          simulationProgress.value = 0;
        }
        if (data.isReady) finish(Status.Ready);
        else if (data.isFailed) finish(Status.Failed);
      } catch {
        if (!isStale()) finish(Status.Failed);
      }
    }, POLL_INTERVAL);
  };

  // File selection triggers upload
  watch(files, async (val) => {
    reset();
    if (!val?.length) return;
    status.value = Status.Uploading;
    try {
      const result = await aiAPI.upload(
        val,
        vectorStoreId.value ?? undefined,
      );
      vectorStoreId.value = result.vectorStoreId;
      documents.value = result.documents;
      status.value = Status.Indexing;
      pollIndexingStatus(result.vectorStoreId);
    } catch {
      reset();
    }
  });

  onBeforeUnmount(stopTimers);

  const progress = reactive({ status, isActive, val, label, message });
  return { files, progress };
};

import type {
  FeedbackStatus,
  ScoringRubric,
} from '@tailor-cms/interfaces/feedback';
import type { AiRequestReviewReq } from '@tailor-cms/api-client';
import { api } from '@/api';
import { feedback as feedbackConfig } from '@tailor-cms/config';
import { keys, pickBy } from 'lodash-es';
import { useLocalStorage } from '@vueuse/core';
import { useConfigStore } from './config';
import { useCurrentRepository } from './current-repository';

// Background analyses take a few model+tool round-trips; poll the
// cached status until the run lands
const POLL_INTERVAL_MS = 5000;
const POLL_LIMIT = 60;

// Below this viewport width the Lens drawer overlays the main content
// instead of pushing it (mirrors the drawer's mobile-breakpoint).
export const LENS_OVERLAY_BELOW_WIDTH = 1800;

export type RubricId = NonNullable<AiRequestReviewReq['body']['rubricId']>;

export const useReviewStore = defineStore('review', () => {
  const configStore = useConfigStore();
  const repositoryStore = useCurrentRepository();
  // Renoir's shared run flag; the two AI runs are mutually exclusive
  // (the agent panel blocks sending while a review runs).
  const { isAgentRunning } = useAgentRunState();

  const isEnabled = ref(false);

  const isLensAvailable = computed(
    () => configStore.isAiAvailable && isEnabled.value,
  );
  const repositoryId = ref<number | null>(null);
  const activityId = ref<number | null>(null);
  const rubrics = ref<ScoringRubric[]>([]);
  // Cached status per scoring rubric for the current activity
  const statuses = ref<Record<string, FeedbackStatus>>({});

  const selectedRubricId = ref<string | null>(null);
  const selectedRubric = computed(
    () => rubrics.value.find((it) => it.id === selectedRubricId.value) ?? null,
  );

  const status = computed(() =>
    selectedRubricId.value
      ? (statuses.value[selectedRubricId.value] ?? null)
      : null,
  );

  // Sidebar visibility
  const isPanelOpen = useLocalStorage('editor:review-sidebar', true);

  const isRunning = computed(() => status.value?.status === 'running');
  const runningRubricIds = computed(() =>
    keys(pickBy(statuses.value, { status: 'running' })) as RubricId[],
  );
  const isAnyRunning = computed(() => runningRubricIds.value.length > 0);

  let pollHandle: ReturnType<typeof setTimeout> | null = null;
  let pollCount = 0;

  /**
   * Bind the store to an editor context.
   */
  const initialize = async (newRepositoryId: number, targetActivityId: number) => {
    if (repositoryId.value !== newRepositoryId) {
      repositoryId.value = newRepositoryId;
      const schemaId = (repositoryStore.repository as any)?.schema;
      const config = schemaId
        ? feedbackConfig.resolveConfig(schemaId)
        : { isEnabled: false, rubrics: [] };
      isEnabled.value = config.isEnabled;
      rubrics.value = config.rubrics;
      selectedRubricId.value = config.rubrics[0]?.id ?? null;
    }
    activityId.value = targetActivityId;
    statuses.value = {};
    if (isEnabled.value) await fetch();
  };

  const selectRubric = async (rubricId: string) => {
    selectedRubricId.value = rubricId;
    if (!statuses.value[rubricId]) await fetch();
  };

  const fetchRubric = async (rubricId: RubricId) => {
    const data = (await api.ai.getReview({
      params: {
        repositoryId: repositoryId.value!,
        activityId: activityId.value!,
      },
      query: { rubricId },
    })) as FeedbackStatus;
    statuses.value[rubricId] = data;
  };

  const fetch = async () => {
    if (!repositoryId.value || !activityId.value || !selectedRubricId.value) return;
    await fetchRubric(selectedRubricId.value as RubricId);
    if (isAnyRunning.value) schedulePoll();
  };

  const requestAnalysis = async (force = false) => {
    if (!repositoryId.value || !activityId.value || !selectedRubricId.value) {
      return;
    }
    // Renoir may be mutating the content right now; analyzing a moving
    // target would produce misleading feedback.
    if (isAgentRunning.value) return;
    const rubricId = selectedRubricId.value as RubricId;
    const data = (await api.ai.requestReview({
      params: {
        repositoryId: repositoryId.value,
        activityId: activityId.value,
      },
      body: { rubricId, force },
    })) as FeedbackStatus;
    statuses.value[rubricId] = data;
    pollCount = 0;
    if (isAnyRunning.value) schedulePoll();
  };

  const schedulePoll = () => {
    stopPolling();
    if (pollCount >= POLL_LIMIT) return;
    pollHandle = setTimeout(async () => {
      pollCount += 1;
      // Refresh every in-flight rubric - not just the one on screen - so a
      // background run keeps updating and eventually releases the Renoir
      // gate even while the user views a different rubric.
      await Promise.all(runningRubricIds.value.map((id) => fetchRubric(id)));
      if (isAnyRunning.value) schedulePoll();
    }, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (!pollHandle) return;
    clearTimeout(pollHandle);
    pollHandle = null;
  };

  function $reset() {
    stopPolling();
    pollCount = 0;
    repositoryId.value = null;
    activityId.value = null;
    isEnabled.value = false;
    rubrics.value = [];
    selectedRubricId.value = null;
    statuses.value = {};
  }

  return {
    repositoryId,
    activityId,
    isEnabled,
    isLensAvailable,
    isPanelOpen,
    rubrics,
    selectedRubricId,
    selectedRubric,
    status,
    isRunning,
    isAnyRunning,
    initialize,
    selectRubric,
    fetch,
    requestAnalysis,
    $reset,
  };
});

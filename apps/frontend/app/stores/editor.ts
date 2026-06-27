import { activity as activityUtils, Events } from '@tailor-cms/utils';
import { filter, flatMap, reduce } from 'lodash-es';
import { schema } from '@tailor-cms/config';
import type { Revision } from '@tailor-cms/interfaces/revision';

import type { HistoryEntry } from '@/lib/revision';
import type { StoreActivity } from './activity';
import type { StoreContentElement } from './content-elements';
import { useActivityStore } from './activity';
import { useCommentStore } from './comments';
import { useCurrentRepository } from './current-repository';
import { useContentElementStore } from './content-elements';

const { getDescendants } = activityUtils;

export const useEditorStore = defineStore('editor', () => {
  const repositoryStore = useCurrentRepository();
  const activityStore = useActivityStore();
  const commentStore = useCommentStore();
  const elementStore = useContentElementStore();

  const repositoryId = computed(() => repositoryStore.repositoryId as number);
  const selectedActivityId = ref<number | null>(null);
  const selectedContentElementId = ref<number | null>(null);
  const selectedContentElement = ref<StoreContentElement | null>(null);
  const showDiff = ref(false);
  const isDetailsPanelExpanded = ref(false);
  // Only an explicit user toggle animates the panel
  const isDetailsPanelAnimated = ref(false);
  // Set to preview a past revision: the editor reconstructs the activity at
  // this moment, read-only. Mutually exclusive with publish-diff.
  const historyRevision = ref<HistoryEntry | null>(null);
  // Diff baseline for the preview - the preceding revision ("what changed
  // here"). Null on the oldest revision.
  const historyPreviousRevision = ref<Revision | null>(null);

  const selectedActivity = computed(() => {
    if (!selectedActivityId.value) return null;
    return activityStore.findById(selectedActivityId.value);
  });

  const rootContainerGroups = computed(() => {
    if (!selectedActivity.value) return {};
    const { id, type } = selectedActivity.value;
    const containers = schema.getSupportedContainers(type);
    return reduce(
      containers,
      (acc, { type }) => {
        acc[type] = filter(repositoryStore.activities, { parentId: id, type });
        return acc;
      },
      {} as Record<string, StoreActivity[]>,
    );
  });

  const contentContainers = computed(() => {
    if (!selectedActivity.value) return [];
    const parents = flatMap(rootContainerGroups.value);
    return parents.reduce((acc, parent) => {
      const descendants = getDescendants(repositoryStore.activities, parent);
      acc.push(parent, ...descendants as StoreActivity[]);
      return acc;
    }, [] as StoreActivity[]);
  });

  const initialize = async (activityId: number) => {
    // Pull the selected activity's subtree (the activity itself + its
    // container descendants and any sub-containers) into the activity store.
    await activityStore.fetch(repositoryId.value, { subtreeOf: activityId });
    $reset();
    selectedActivityId.value = activityId;
  };

  // Comment events arrive via the editor channel; each `action` carries a
  // different payload shape (save vs. remove vs. last-seen vs. resolve),
  // so the outer payload is `unknown` and each branch refines it.
  const processCommentEvent = ({
    action,
    payload,
  }: {
    action: Events.Discussion;
    payload: unknown;
  }) => {
    const { Save, Remove, SetLastSeen, Resolve } = Events.Discussion;
    const editorContext = {
      repositoryId: repositoryId.value,
      activityId: selectedActivityId.value!,
    };
    switch (action) {
      case Save:
        return commentStore.save({
          ...(payload as Parameters<typeof commentStore.save>[0]),
          ...editorContext,
        });
      case Remove:
        return commentStore.remove(repositoryId.value, payload as number);
      case SetLastSeen:
        return commentStore.markSeenComments(
          payload as Parameters<typeof commentStore.markSeenComments>[0],
        );
      case Resolve:
        return commentStore.updateResolvement(
          repositoryId.value,
          payload as Parameters<typeof commentStore.updateResolvement>[1],
        );
    }
  };

  const unlinkActivity = async (activityId: number) => {
    const unlinked = await activityStore.unlink(activityId);
    // Backend batch-updates elements without hooks, so no SSE events fire.
    // Update elements locally to reflect the unlinked state.
    elementStore.items.forEach((el) => {
      if (el.isLinkedCopy) el.isLinkedCopy = false;
    });
    return unlinked;
  };

  const isHistoryMode = computed(() => historyRevision.value !== null);
  const isPreviewMode = computed(
    () => showDiff.value || isHistoryMode.value,
  );

  const canExpandDetailsPanel = computed(
    () =>
      !!selectedActivity.value &&
      !selectedActivity.value.isLinkedCopy,
  );

  const toggleDiff = (value?: boolean) => {
    showDiff.value = value ?? !showDiff.value;
    if (showDiff.value) {
      isDetailsPanelExpanded.value = false;
      historyRevision.value = null;
    }
  };

  const enterHistoryMode = (
    revision: HistoryEntry,
    previousRevision: Revision | null = null,
  ) => {
    historyRevision.value = revision;
    historyPreviousRevision.value = previousRevision;
    showDiff.value = false;
    isDetailsPanelExpanded.value = false;
  };

  const exitHistoryMode = () => {
    historyRevision.value = null;
    historyPreviousRevision.value = null;
  };

  const toggleDetailsPanel = () => {
    if (!canExpandDetailsPanel.value) return;
    isDetailsPanelAnimated.value = true;
    isDetailsPanelExpanded.value = !isDetailsPanelExpanded.value;
  };

  watch(canExpandDetailsPanel, (canExpand) => {
    if (canExpand) return;
    isDetailsPanelAnimated.value = false;
    isDetailsPanelExpanded.value = false;
  });

  // When the selected activity has no content containers, the canvas is empty
  // and the metadata fields are the only thing to interact with.
  watch(selectedActivity, (activity) => {
    if (!activity || !canExpandDetailsPanel.value) return;
    const hasContainers = !!schema.getSupportedContainers(activity.type).length;
    const hasMetadata = !!schema.getActivityMetadata(activity)?.length;
    if (!hasContainers && hasMetadata) {
      isDetailsPanelAnimated.value = false;
      isDetailsPanelExpanded.value = true;
    }
  });

  function $reset() {
    selectedActivityId.value = null;
    selectedContentElementId.value = null;
    selectedContentElement.value = null;
    showDiff.value = false;
    historyRevision.value = null;
    historyPreviousRevision.value = null;
  }

  return {
    repositoryId,
    selectedActivityId,
    selectedContentElementId,
    selectedActivity,
    selectedContentElement,
    showDiff,
    historyRevision,
    historyPreviousRevision,
    isHistoryMode,
    isPreviewMode,
    isDetailsPanelExpanded,
    isDetailsPanelAnimated,
    canExpandDetailsPanel,
    rootContainerGroups,
    contentContainers,
    initialize,
    processCommentEvent,
    unlinkActivity,
    toggleDiff,
    toggleDetailsPanel,
    enterHistoryMode,
    exitHistoryMode,
    $reset,
  };
});

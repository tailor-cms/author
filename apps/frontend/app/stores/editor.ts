import type { Guideline } from '@tailor-cms/interfaces/schema';
import { activity as activityUtils, Events } from '@tailor-cms/utils';
import { filter, flatMap, reduce } from 'lodash-es';
import { schema } from '@tailor-cms/config';

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
  const { $ceRegistry } = useNuxtApp();

  const repositoryId = computed(() => repositoryStore.repositoryId as number);
  const selectedActivityId = ref<number | null>(null);
  const selectedContentElementId = ref<number | null>(null);
  const selectedContentElement = ref<StoreContentElement | null>(null);
  const showPublishDiff = ref(false);
  const isDetailsPanelExpanded = ref(false);

  const selectedActivity = computed(() => {
    if (!selectedActivityId.value) return null;
    return activityStore.findById(selectedActivityId.value);
  });

  const guidelines = computed(() => {
    if (!repositoryStore.repository || !selectedActivity.value) return;
    const { type } = selectedActivity.value;
    const guidelines = schema.getLevel(type)?.guidelines?.(
      repositoryStore.repository,
      contentContainers.value,
      elementStore.items,
      $ceRegistry,
    ) as Guideline[] | undefined;
    return guidelines;
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
    await activityStore.fetch(repositoryId.value, { outlineOnly: true });
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

  const canExpandDetailsPanel = computed(
    () =>
      !!selectedActivity.value &&
      !selectedActivity.value.isLinkedCopy &&
      !showPublishDiff.value,
  );

  const togglePublishDiff = (value?: boolean) => {
    showPublishDiff.value = value ?? !showPublishDiff.value;
    if (showPublishDiff.value) isDetailsPanelExpanded.value = false;
  };

  watch(canExpandDetailsPanel, (canExpand) => {
    if (!canExpand) isDetailsPanelExpanded.value = false;
  });

  function $reset() {
    selectedActivityId.value = null;
    selectedContentElementId.value = null;
    selectedContentElement.value = null;
    showPublishDiff.value = false;
  }

  return {
    repositoryId,
    selectedActivityId,
    selectedContentElementId,
    selectedActivity,
    selectedContentElement,
    showPublishDiff,
    isDetailsPanelExpanded,
    canExpandDetailsPanel,
    rootContainerGroups,
    contentContainers,
    guidelines,
    initialize,
    processCommentEvent,
    unlinkActivity,
    togglePublishDiff,
    $reset,
  };
});

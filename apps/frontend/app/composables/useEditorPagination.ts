import { findIndex, groupBy, reject, sortBy } from 'lodash-es';

import type { StoreActivity } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';
import { useEditorStore } from '@/stores/editor';

const ROOT = 'root';

/** Depth-first walk of the activity tree, mirroring the sidebar order. */
const toReadingOrder = (activities: StoreActivity[]) => {
  const sorted = sortBy(activities, 'position');
  const byParent = groupBy(sorted, (it) => it.parentId ?? ROOT);
  const descendantsOf = (parentId: number | string): StoreActivity[] =>
    (byParent[parentId] ?? []).flatMap((it) => [it, ...descendantsOf(it.id)]);
  return descendantsOf(ROOT);
};

export const useEditorPagination = () => {
  const route = useRoute();
  const repositoryStore = useCurrentRepository();
  const editorStore = useEditorStore();

  // Collections are sidebar-sorted, not positioned; preview lenses would be
  // silently dropped by navigating away.
  const isEnabled = computed(
    () => !repositoryStore.isCollection && !editorStore.isPreviewMode,
  );

  const sequence = computed(() => {
    if (!isEnabled.value) return [];
    const activities = reject(repositoryStore.outlineActivities, 'deletedAt');
    return toReadingOrder(activities);
  });

  // Route leads the store: selectedActivityId lands only after the fetch.
  const currentActivityId = computed(() => {
    const id = Number(route.params.activityId);
    return Number.isNaN(id) ? editorStore.selectedActivityId : id;
  });

  const currentIndex = computed(() => {
    const id = currentActivityId.value;
    return id ? findIndex(sequence.value, { id }) : -1;
  });

  const neighbor = (offset: number) => {
    if (currentIndex.value < 0) return null;
    return sequence.value[currentIndex.value + offset] ?? null;
  };

  const previous = computed(() => neighbor(-1));
  const next = computed(() => neighbor(1));

  const getRoute = (activity: StoreActivity) => ({
    name: 'editor',
    params: { id: repositoryStore.repositoryId, activityId: activity.id },
  });

  const goTo = (activity: StoreActivity | null) => {
    if (!activity) return;
    return navigateTo(getRoute(activity));
  };

  return {
    isEnabled,
    sequence,
    currentIndex,
    previous,
    next,
    getRoute,
    goToPrevious: () => goTo(previous.value),
    goToNext: () => goTo(next.value),
  };
};

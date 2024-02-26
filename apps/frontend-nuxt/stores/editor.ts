import { activity as activityUtils } from '@tailor-cms/utils';
import filter from 'lodash/filter';
import flatMap from 'lodash/flatMap';
import reduce from 'lodash/reduce';
import { schema } from 'tailor-config-shared';

import type { StoreContentElement } from './content-elements';
import { useActivityStore } from './activity';
import { useCurrentRepository } from './current-repository';

const { getDescendants } = activityUtils;

export const useEditorStore = defineStore('editor', () => {
  const repositoryStore = useCurrentRepository();
  const activityStore = useActivityStore();

  const repositoryId = computed(() => repositoryStore.repositoryId);
  const selectedActivityId = ref<number | null>(null);
  const selectedContentElementId = ref<number | null>(null);
  const selectedContentElement = ref<StoreContentElement | null>(null);

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
      (acc: any, { type }) => {
        acc[type] = filter(repositoryStore.activities, { parentId: id, type });
        return acc;
      },
      {},
    );
  });

  const contentContainers = computed(() => {
    if (!selectedActivity.value) return [];
    const parents = flatMap(rootContainerGroups.value);
    return parents.reduce((acc: any[], parent) => {
      acc.push(parent, ...getDescendants(repositoryStore.activities, parent));
      return acc;
    }, []);
  });

  const initialize = (activityId: number) => {
    selectedActivityId.value = activityId;
  };

  function $reset() {
    selectedActivityId.value = null;
  }

  return {
    repositoryId,
    selectedActivityId,
    selectedContentElementId,
    selectedActivity,
    selectedContentElement,
    rootContainerGroups,
    contentContainers,
    initialize,
    $reset,
  };
});

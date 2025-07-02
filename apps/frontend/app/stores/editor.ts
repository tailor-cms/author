import { activity as activityUtils, Events } from '@tailor-cms/utils';
import { filter, flatMap, reduce } from 'lodash-es';
import { schema } from '@tailor-cms/config';
import type { Guideline } from '@tailor-cms/interfaces/schema';

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
    await activityStore.fetch(repositoryId.value, { activityId });
    $reset();
    selectedActivityId.value = activityId;
  };

  const processCommentEvent = ({
    action,
    payload,
  }: {
    action: Events.Discussion;
    payload: any;
  }) => {
    const { Save, Remove, SetLastSeen, Resolve } = Events.Discussion;
    const editorContext = {
      repositoryId: repositoryId.value,
      activityId: selectedActivityId.value,
    };
    const resolvedAction = {
      [Save]: (payload: any) =>
        commentStore.save({ ...payload, ...editorContext }),
      [Remove]: (id: number) => commentStore.remove(repositoryId.value, id),
      [SetLastSeen]: (payload: any) => commentStore.markSeenComments(payload),
      [Resolve]: (payload: any) =>
        commentStore.updateResolvement(repositoryId.value, payload),
    }[action];
    if (!resolvedAction) return;
    return resolvedAction(payload);
  };

  const togglePublishDiff = (value?: boolean) => {
    showPublishDiff.value = value ?? !showPublishDiff.value;
  };

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
    rootContainerGroups,
    contentContainers,
    guidelines,
    initialize,
    processCommentEvent,
    togglePublishDiff,
    $reset,
  };
});

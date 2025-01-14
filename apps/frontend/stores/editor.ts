import { activity as activityUtils, Events } from '@tailor-cms/utils';
import filter from 'lodash/filter';
import flatMap from 'lodash/flatMap';
import reduce from 'lodash/reduce';
import { schema } from '@tailor-cms/config';

import type { StoreContentElement } from './content-elements';
import { useActivityStore } from './activity';
import { useCommentStore } from './comments';
import { useCurrentRepository } from './current-repository';

const { getDescendants } = activityUtils;

export const useEditorStore = defineStore('editor', () => {
  const repositoryStore = useCurrentRepository();
  const activityStore = useActivityStore();
  const commentStore = useCommentStore();

  const repositoryId = computed(() => repositoryStore.repositoryId as number);
  const selectedActivityId = ref<number | null>(null);
  const selectedContentElementId = ref<number | null>(null);
  const selectedContentElement = ref<StoreContentElement | null>(null);
  const showPublishDiff = ref(false);

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
    initialize,
    processCommentEvent,
    togglePublishDiff,
    $reset,
  };
});

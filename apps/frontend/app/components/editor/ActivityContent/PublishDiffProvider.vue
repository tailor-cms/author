<template>
  <div>
    <slot
      v-if="showDiff"
      v-bind="{
        processedElements,
        processedContainerGroups,
        processedActivities,
      }"
    >
    </slot>
    <slot
      v-else
      :processed-activities="activities"
      :processed-container-groups="containerGroups"
      :processed-elements="elements"
    >
    </slot>
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep, filter, map, mapValues, merge, omit, reduce } from 'lodash-es';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { isAfter } from 'date-fns/isAfter';
import { PublishDiffChangeTypes } from '@tailor-cms/utils';

import { revision as api } from '@/api';

const { New, Removed, Changed } = PublishDiffChangeTypes;
type Content = ContentElement | Activity;

const getPublishedState = (revisions: any[]) =>
  revisions.reduce(
    (all: Content, { state }: { state: Content }) => ({
      ...all,
      [state.uid]: omit(state, [
        'detached',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    }),
    {},
  );

interface Props {
  repositoryId: number;
  activityId: number;
  activities?: Activity[];
  elements?: Record<string, ContentElement>;
  containerGroups?: Record<string, Activity[]>;
  publishTimestamp?: string;
  showDiff?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  activities: () => [],
  elements: () => ({}),
  containerGroups: () => ({}),
  publishTimestamp: '',
  showDiff: false,
});

const publishedActivities = ref<Record<string, Activity>>({});
const publishedElements = ref<Record<string, ContentElement>>({});

const processedActivities = computed(() => {
  const activities = cloneDeep(props.activities);
  return merge(activities, publishedActivities.value);
});

const processedElements = computed(() => {
  const elements = cloneDeep(props.elements);
  return mapValues(merge(elements, publishedElements.value), addChangeType);
});

const processedContainerGroups = computed(() => {
  return reduce(props.containerGroups, addPublishedContainersToGroup, {});
});

const isAdded = (element: ContentElement) => {
  if (!props.publishTimestamp) return true;
  const createdAt = new Date(element.createdAt);
  const publishedAt = new Date(props.publishTimestamp);
  return isAfter(createdAt, publishedAt);
};

const isModified = (element: ContentElement) => {
  if (!props.publishTimestamp) return false;
  const updatedAt = new Date(element.updatedAt);
  const publishedAt = new Date(props.publishTimestamp);
  return isAfter(updatedAt, publishedAt);
};

const isRemoved = (element: ContentElement) => {
  element = props.elements[element.uid];
  return !element || element.detached;
};

const getChangeType = (element: ContentElement) => {
  if (isRemoved(element)) return Removed;
  if (isAdded(element)) return New;
  if (isModified(element)) return Changed;
  return null;
};

const addChangeType = (element: ContentElement) => {
  return { ...element, changeSincePublish: getChangeType(element) };
};

const addPublishedContainersToGroup = (
  groups: Record<string, Activity[]>,
  group: Activity[],
  type: string,
) => {
  const publishedContainers = filter(publishedActivities.value, {
    type,
    parentId: props.activityId,
  });
  return {
    ...groups,
    [type]: [...group, ...publishedContainers],
  };
};

const fetchPublishedState = () => {
  const query = {
    activityId: props.activityId,
    elementIds: map(props.elements, 'id'),
    timestamp: props.publishTimestamp,
  };
  return api
    .getStateAtMoment(props.repositoryId, query)
    .then(({ activities, elements }) => {
      publishedElements.value = getPublishedState(elements);
      publishedActivities.value = getPublishedState(activities);
    });
};

watch(
  () => props.showDiff,
  (isOn) => {
    if (isOn) fetchPublishedState();
  },
);
</script>

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
      :processed-elements="elements"
      :processed-container-groups="containerGroups"
      :processed-activities="activities"
    >
    </slot>
  </div>
</template>

<script lang="ts" setup>
import cloneDeep from 'lodash/cloneDeep';
import filter from 'lodash/filter';
import isAfter from 'date-fns/isAfter';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import { publishDiffChangeTypes } from '@tailor-cms/utils';
import reduce from 'lodash/reduce';

import { revision as api } from '@/api';

const { NEW, REMOVED, CHANGED } = publishDiffChangeTypes;
const getPublishedState = (revisions: any) =>
  revisions.reduce(
    (all: any, { state }: { state: any }) => ({
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

const props = defineProps({
  repositoryId: { type: Number, required: true },
  activityId: { type: Number, required: true },
  activities: { type: Object, default: () => ({}) },
  elements: { type: Object, default: () => ({}) },
  containerGroups: { type: Object, default: () => ({}) },
  publishTimestamp: { type: String, default: null },
  showDiff: { type: Boolean, default: false },
});

const publishedActivities = ref({});
const publishedElements = ref({});

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

const isAdded = (element: any) => {
  if (!props.publishTimestamp) return true;
  const createdAt = new Date(element.createdAt);
  const publishedAt = new Date(props.publishTimestamp);
  return isAfter(createdAt, publishedAt);
};

const isModified = (element: any) => {
  if (!props.publishTimestamp) return false;
  const updatedAt = new Date(element.updatedAt);
  const publishedAt = new Date(props.publishTimestamp);
  return isAfter(updatedAt, publishedAt);
};

const isRemoved = (element: any) => {
  element = props.elements[element.uid];
  return !element || element.detached;
};

const getChangeType = (element: any) => {
  if (isRemoved(element)) return REMOVED;
  if (isAdded(element)) return NEW;
  if (isModified(element)) return CHANGED;
  return null;
};

const addChangeType = (element: any) => {
  return { ...element, changeSincePublish: getChangeType(element) };
};

const addPublishedContainersToGroup = (
  groups: any,
  group: any,
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

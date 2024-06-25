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
import cloneDeep from 'lodash/cloneDeep';
import filter from 'lodash/filter';
import { isAfter } from 'date-fns/isAfter';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import { publishDiffChangeTypes } from '@tailor-cms/utils';
import reduce from 'lodash/reduce';

import type { Activity } from '@/api/interfaces/activity';
import { revision as api } from '@/api';
import type { ContentElement } from '@/api/interfaces/content-element';

const { NEW, REMOVED, CHANGED } = publishDiffChangeTypes;
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
  if (isRemoved(element)) return REMOVED;
  if (isAdded(element)) return NEW;
  if (isModified(element)) return CHANGED;
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

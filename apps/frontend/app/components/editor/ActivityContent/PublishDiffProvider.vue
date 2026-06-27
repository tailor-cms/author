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
import {
  cloneDeep,
  differenceBy,
  filter,
  isEqual,
  mapValues,
  merge,
  omit,
  reduce,
} from 'lodash-es';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { PublishDiffChangeTypes } from '@tailor-cms/utils';

import { api } from '@/api';

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
  const merged = merge(cloneDeep(props.elements), publishedElements.value);
  return mapValues(merged, (element, uid) => ({
    ...element,
    diffChange: getChangeType(uid),
  }));
});

const processedContainerGroups = computed(() => {
  return reduce(props.containerGroups, addPublishedContainersToGroup, {});
});

const sameContent = (a: ContentElement, b: ContentElement) =>
  isEqual(a.data, b.data) && isEqual(a.meta, b.meta) && isEqual(a.refs, b.refs);

// Content diff vs the published snapshot (deep-equal on data/meta/refs), so a
// no-op save - touched timestamp, identical content - isn't flagged as changed.
const getChangeType = (uid: string) => {
  const live = props.elements[uid];
  const published = publishedElements.value[uid];
  if (!live || live.detached) return Removed;
  if (!published) return New;
  return sameContent(live, published) ? null : Changed;
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
  // Only resurrect containers removed since publish; keep live ones single.
  const removedContainers = differenceBy(publishedContainers, group, 'id');
  return {
    ...groups,
    [type]: [...group, ...removedContainers],
  };
};

const fetchPublishedState = () => {
  return api.revision
    .reconstruct({
      params: { repositoryId: props.repositoryId },
      query: {
        activityId: props.activityId,
        at: props.publishTimestamp,
      },
    })
    .then(({ activities, elements }: any) => {
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

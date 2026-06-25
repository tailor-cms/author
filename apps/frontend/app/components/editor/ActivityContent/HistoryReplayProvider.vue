<template>
  <div class="position-relative">
    <VProgressLinear
      v-if="isFetching"
      absolute
      location="top"
      indeterminate
      height="5"
    />
    <slot
      v-bind="{
        processedElements,
        processedContainerGroups,
        processedActivities,
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import { differenceBy, filter, keyBy, mapValues } from 'lodash-es';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { PublishDiffChangeTypes } from '@tailor-cms/utils';
import type { RevisionReconstructEntity } from '@tailor-cms/api-client';

import { api } from '@/api';

const { Removed } = PublishDiffChangeTypes;

interface Props {
  repositoryId: number;
  activityId: number;
  activities?: Activity[];
  containerGroups?: Record<string, Activity[]>;
  elements?: Record<string, ContentElement>;
  timestamp: string;
  // Preceding revision's timestamp; null on the oldest (no diff).
  previousTimestamp?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  activities: () => [],
  containerGroups: () => ({}),
  elements: () => ({}),
  previousTimestamp: null,
});

const isFetching = ref(true);
const hasLoaded = ref(false);
const historicalActivities = ref<RevisionReconstructEntity[]>([]);
const historicalElements = ref<RevisionReconstructEntity[]>([]);

const notify = useNotification();

const fetchState = async () => {
  if (!props.activityId || !props.timestamp) return;
  isFetching.value = true;
  try {
    const { activities, elements } = await api.revision.reconstruct({
      params: { repositoryId: props.repositoryId },
      query: {
        activityId: props.activityId,
        at: props.timestamp,
        against: props.previousTimestamp ?? undefined,
      },
    });
    historicalActivities.value = activities;
    historicalElements.value = elements;
    hasLoaded.value = true;
  } catch {
    notify('Failed to load revision', { color: 'error' });
  } finally {
    isFetching.value = false;
  }
};

const historicalActivityById = computed(() =>
  keyBy(
    historicalActivities.value
      .filter(({ change }) => change !== Removed)
      .map(({ state }) => state as unknown as Activity),
    'id',
  ),
);

// Live rows overlaid with historical state, plus resurrected
// (historical-only) activities appended.
const processedActivities = computed<Activity[]>(() => {
  if (!hasLoaded.value) return props.activities;
  const overlaid = props.activities.map((activity) => {
    const past = historicalActivityById.value[activity.id];
    return past ? { ...activity, ...past } : activity;
  });
  const resurrected = differenceBy(
    Object.values(historicalActivityById.value),
    props.activities,
    'id',
  );
  return [...overlaid, ...resurrected];
});

// Per group: containers alive at the moment (others dropped) + resurrected
// historical-only ones re-added.
const processedContainerGroups = computed<Record<string, Activity[]>>(() => {
  if (!hasLoaded.value) return props.containerGroups;
  return mapValues(props.containerGroups, (group, type) => {
    const alive = group
      .filter((container) => historicalActivityById.value[container.id])
      .map((container) => ({
        ...container,
        ...historicalActivityById.value[container.id],
      }));
    const resurrected = differenceBy(
      filter(historicalActivityById.value, { type, parentId: props.activityId }),
      group,
      'id',
    );
    return [...alive, ...resurrected];
  });
});

// `change` maps onto `changeSincePublish` (ContentElement's diff styling); the
// live element is merged under to keep view-only fields like `comments`.
const processedElements = computed<Record<string, ContentElement>>(() => {
  if (!hasLoaded.value) return props.elements;
  return keyBy(
    historicalElements.value.map(({ uid, state, change }) => ({
      ...(props.elements[uid] ?? {}),
      ...(state as unknown as ContentElement),
      changeSincePublish: change ?? undefined,
    })),
    'uid',
  );
});

watch(
  () => [props.activityId, props.timestamp, props.previousTimestamp],
  () => fetchState(),
  { immediate: true },
);
</script>

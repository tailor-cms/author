<template>
  <div>
    <div v-if="isFetching" class="text-center pa-8">
      <VProgressCircular indeterminate />
    </div>
    <slot
      v-else
      v-bind="{
        processedElements,
        processedContainerGroups,
        processedActivities,
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import { differenceBy, filter, keyBy, mapValues, omit } from 'lodash-es';
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
const historicalActivities = ref<RevisionReconstructEntity[]>([]);
const historicalElements = ref<RevisionReconstructEntity[]>([]);

// Strip lifecycle fields so it renders as its historical self, not live.
function cleanState<T>(state: Record<string, unknown>): T {
  return omit(state, ['createdAt', 'updatedAt', 'deletedAt', 'detached']) as unknown as T;
}

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
  } finally {
    isFetching.value = false;
  }
};

const historicalActivityById = computed(() =>
  keyBy(
    historicalActivities.value
      .filter((entity) => entity.change !== Removed)
      .map((entity) => cleanState<Activity>(entity.state)),
    'id',
  ),
);

// Live rows overlaid with historical state, plus resurrected
// (historical-only) activities appended.
const processedActivities = computed<Activity[]>(() => {
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
const processedContainerGroups = computed<Record<string, Activity[]>>(() =>
  mapValues(props.containerGroups, (group, type) => {
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
  }),
);

// `change` maps onto `changeSincePublish` (ContentElement's diff styling); the
// live element is merged under to keep view-only fields like `comments`.
const processedElements = computed<Record<string, ContentElement>>(() => {
  const result: Record<string, ContentElement> = {};
  for (const entity of historicalElements.value) {
    const state = cleanState<ContentElement>(entity.state);
    result[entity.uid] = {
      ...(props.elements[entity.uid] ?? {}),
      ...state,
      changeSincePublish: entity.change ?? undefined,
    };
  }
  return result;
});

watch(
  () => [props.activityId, props.timestamp, props.previousTimestamp],
  () => fetchState(),
  { immediate: true },
);
</script>

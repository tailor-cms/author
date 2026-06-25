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
import { keyBy, omit, reduce } from 'lodash-es';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import { PublishDiffChangeTypes } from '@tailor-cms/utils';

import { api } from '@/api';

const { Removed } = PublishDiffChangeTypes;

// A reconstructed subtree entity; `change` is null when unchanged.
interface ReconstructEntity {
  id: number;
  uid: string;
  state: Record<string, any>;
  change: PublishDiffChangeTypes | null;
}

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
const historicalActivities = ref<ReconstructEntity[]>([]);
const historicalElements = ref<ReconstructEntity[]>([]);

// Strip lifecycle fields so it renders as its historical self, not live.
const cleanState = <T extends Record<string, any>>(state: T) =>
  omit(state, ['createdAt', 'updatedAt', 'deletedAt', 'detached']) as T;

const fetchState = async () => {
  if (!props.activityId || !props.timestamp) return;
  isFetching.value = true;
  try {
    const { activities, elements }: any = await api.revision.reconstruct({
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

const historicalActivityById = computed<Record<number, Activity>>(() =>
  keyBy(
    historicalActivities.value
      .filter((entity) => entity.change !== Removed)
      .map((entity) => cleanState(entity.state as Activity)),
    'id',
  ),
);

// Live rows overlaid with historical state, plus resurrected
// (historical-only) activities appended.
const processedActivities = computed<Activity[]>(() => {
  const merged: Activity[] = props.activities.map((act) => {
    const past = historicalActivityById.value[act.id];
    return past ? ({ ...act, ...past } as Activity) : act;
  });
  const seen = new Set(merged.map((a) => a.id));
  for (const past of Object.values(historicalActivityById.value)) {
    if (!seen.has(past.id)) merged.push(past as Activity);
  }
  return merged;
});

// Per group: containers alive at the moment (others dropped) + resurrected
// historical-only ones re-added.
const processedContainerGroups = computed<Record<string, Activity[]>>(() => {
  return reduce(
    props.containerGroups,
    (acc: Record<string, Activity[]>, group: Activity[], type: string) => {
      const alive = group
        .filter((c) => historicalActivityById.value[c.id])
        .map((c) => ({ ...c, ...historicalActivityById.value[c.id] }));
      const currentIds = new Set(group.map((c) => c.id));
      const resurrected = Object.values(historicalActivityById.value).filter(
        (a: any) =>
          a.type === type
          && a.parentId === props.activityId
          && !currentIds.has(a.id),
      );
      acc[type] = [...alive, ...resurrected] as Activity[];
      return acc;
    },
    {} as Record<string, Activity[]>,
  );
});

// `change` maps onto `changeSincePublish` (ContentElement's diff styling); the
// live element is merged under to keep view-only fields like `comments`.
const processedElements = computed<Record<string, ContentElement>>(() => {
  const result: Record<string, ContentElement> = {};
  for (const entity of historicalElements.value) {
    const state = cleanState(entity.state as ContentElement);
    result[entity.uid] = {
      ...(props.elements[entity.uid] ?? {}),
      ...state,
      changeSincePublish: entity.change,
    } as ContentElement;
  }
  return result;
});

watch(
  () => [props.activityId, props.timestamp, props.previousTimestamp],
  () => fetchState(),
  { immediate: true },
);
</script>

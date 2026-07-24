<template>
  <li class="elevation-1 rounded-lg">
    <VListItem
      :disabled="!isContentElement"
      :rounded="isExpanded ? 't-lg' : 'lg'"
      class="revision bg-surface-raised"
      @click="toggle"
    >
      <template #subtitle>
        <span
          v-tooltip:bottom="{ text: fullTimestamp, openDelay: 300 }"
          data-percy="hide"
        >
          {{ timeOfDay }} · {{ revision.user?.label }}
        </span>
      </template>
      <template #title>
        <VListItemTitle class="text-title-small font-weight-medium text-truncate">
          {{ description }}
        </VListItemTitle>
      </template>
      <template #prepend>
        <VAvatar
          :color="color"
          :text="acronym"
          size="42"
          variant="tonal"
        />
      </template>
      <template v-if="isContentElement" #append>
        <VIcon :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
      </template>
    </VListItem>
    <VFadeTransition>
      <EntityRevisions
        v-if="isExpanded"
        :is-detached="!activity"
        :revision="props.revision"
      />
    </VFadeTransition>
  </li>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import { find } from 'lodash-es';
import { formatDate } from '@vueuse/core';
import type { Revision } from '@tailor-cms/interfaces/revision';

import EntityRevisions from './EntityRevisions.vue';
import {
  getFormatDescription,
  getRevisionAcronym,
  getRevisionColor,
} from '@/lib/revision';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const activityStore = useActivityStore();
const currentRepositoryStore = useCurrentRepository();

const props = defineProps<{ revision: Revision }>();

const isExpanded = ref(false);

const activity = computed(() => {
  const { state } = props.revision;
  const activityId = (state.activityId || state.id) as number;
  return getOutlineLocation(activityStore.getParent(activityId));
});

const acronym = computed(() => getRevisionAcronym(props.revision));
const color = computed(() => getRevisionColor(props.revision));
const date = computed(() => new Date(props.revision.createdAt));

const description = computed(() =>
  getFormatDescription(props.revision, activity.value),
);

const timeOfDay = computed(() => formatDate(date.value, 'h:mm A'));
const fullTimestamp = computed(() =>
  formatDate(date.value, 'MMMM Do, YYYY h:mm A'),
);

const isContentElement = computed(
  () => props.revision.entity === 'CONTENT_ELEMENT',
);

const getOutlineLocation: any = (activity: Activity) => {
  if (!activity) return null;
  const level = find(currentRepositoryStore.taxonomy, { type: activity.type });
  if (level) return { ...activity, label: level.label };
  return getOutlineLocation(activityStore.getParent(activity.id));
};

const toggle = () => {
  if (isContentElement.value) isExpanded.value = !isExpanded.value;
};
</script>

<style lang="scss" scoped>
li + li {
  margin-top: 0.5rem;
}

.revision.v-list-item {
  transition: all 0.3s ease;

  &.v-list-item--disabled {
    opacity: 1;
  }
}
</style>

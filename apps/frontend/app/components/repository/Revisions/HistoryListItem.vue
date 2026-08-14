<template>
  <VListItem
    :active="isActive"
    :link="selectable"
    class="history-item"
    rounded="lg"
    density="compact"
    @click="selectable && $emit('select')"
  >
    <template #prepend>
      <VIcon :color="change.color" :icon="change.icon" />
    </template>
    <VListItemTitle class="title-line text-title-small">
      {{ description }}
    </VListItemTitle>
    <VListItemSubtitle
      v-tooltip:bottom="{ text: fullTimestamp, openDelay: 300 }"
      class="text-label-medium"
      data-percy="hide"
    >
      {{ timeOfDay }} · {{ revision.user?.label ?? 'Unknown' }}
    </VListItemSubtitle>
    <template #append>
      <VChip
        v-if="isPublished"
        color="secondary"
        size="x-small"
        text="Published"
        variant="tonal"
      />
      <VBtn
        v-if="childrenCount > 0"
        v-tooltip:bottom="{ text: expandLabel, openDelay: 300 }"
        v-bind="activatorProps"
        :aria-label="expandLabel"
        :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        class="ml-1"
        size="x-small"
        variant="text"
        @click.stop
      />
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { find } from 'lodash-es';
import pluralize from 'pluralize-esm';
import { formatDate } from '@vueuse/core';
import type { Activity } from '@tailor-cms/interfaces/activity';
import { Operation } from '@tailor-cms/interfaces/revision';

import { getFormatDescription, type HistoryEntry } from '@/lib/revision';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const CHANGE = {
  [Operation.Create]: { icon: 'mdi-plus-circle-outline', color: 'success' },
  [Operation.Update]: { icon: 'mdi-circle-edit-outline', color: 'warning' },
  [Operation.Remove]: { icon: 'mdi-minus-circle-outline', color: 'error' },
} as const;

const props = withDefaults(defineProps<{
  revision: HistoryEntry;
  isActive?: boolean;
  isPublished?: boolean;
  isExpanded?: boolean;
  childrenCount?: number;
  // False renders a static, non-clickable row.
  selectable?: boolean;
  // VListGroup activator props - bound to the chevron so it toggles the group.
  activatorProps?: Record<string, unknown>;
}>(), {
  childrenCount: 0,
  selectable: true,
});

defineEmits<{
  (e: 'select'): void;
}>();

const activityStore = useActivityStore();
const currentRepositoryStore = useCurrentRepository();

const getOutlineLocation: any = (activity: Activity) => {
  if (!activity) return null;
  const level = find(currentRepositoryStore.taxonomy, { type: activity.type });
  if (level) return { ...activity, label: level.label };
  return getOutlineLocation(activityStore.getParent(activity.id));
};

const activity = computed(() => {
  if (props.revision.isRestore) return null;
  const state = props.revision.state as any;
  const activityId = (state.activityId || state.id) as number;
  return getOutlineLocation(activityStore.getParent(activityId));
});

const description = computed(() => props.revision.isRestore
  ? 'Restored a previous version'
  : getFormatDescription(props.revision, activity.value, { omitContainer: true }),
);

const date = computed(() => new Date(props.revision.createdAt));
const timeOfDay = computed(() => formatDate(date.value, 'h:mm A'));
const fullTimestamp = computed(() => formatDate(date.value, 'MMMM Do, YYYY h:mm A'));

const change = computed(() => {
  if (props.revision.isRestore) return { icon: 'mdi-restore', color: 'info' };
  return CHANGE[props.revision.operation] ?? CHANGE[Operation.Update];
});

const expandLabel = computed(() => {
  const isRestore = props.revision.isRestore;
  const noun = pluralize(isRestore ? 'change' : 'edit', props.childrenCount);
  if (props.isExpanded) return `Collapse ${noun}`;
  return isRestore
    ? `Show ${props.childrenCount} ${noun}`
    : `Show ${props.childrenCount} more ${noun}`;
});
</script>

<style lang="scss" scoped>
.title-line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.35;
}
</style>

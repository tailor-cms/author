<template>
  <VListItem
    :active="isActive"
    class="history-item"
    rounded="lg"
    density="compact"
    @click="$emit('select')"
  >
    <template #prepend>
      <VIcon :color="change.color" :icon="change.icon" />
    </template>
    <VListItemTitle class="title-line text-title-small font-weight-medium">
      {{ description }}
    </VListItemTitle>
    <VListItemSubtitle
      v-tooltip:bottom="{ text: fullTimestamp, openDelay: 300 }"
      class="text-label-medium text-truncate"
    >
      {{ timeOfDay }} · {{ revision.user?.label ?? 'Unknown'
      }}<template v-if="isRestore"> · {{ changeCountLabel }}</template>
    </VListItemSubtitle>
    <template #append>
      <VChip
        v-if="isPublished"
        class="mr-1"
        color="tertiary"
        density="comfortable"
        size="small"
        text="Published"
        variant="tonal"
        rounded="pill"
      />
      <VBtn
        v-if="childrenCount > 0"
        v-tooltip:bottom="{ text: expandLabel, openDelay: 300 }"
        :aria-label="expandLabel"
        :icon="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="x-small"
        variant="text"
        @click.stop="$emit('toggle-expand')"
      />
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { find } from 'lodash-es';
import pluralize from 'pluralize-esm';
import { formatDate, formatTimeAgo } from '@vueuse/core';
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { Revision } from '@tailor-cms/interfaces/revision';
import { Operation } from '@tailor-cms/interfaces/revision';

import { getFormatDescription } from '@/lib/revision';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const CHANGE = {
  [Operation.Create]: { icon: 'mdi-plus-circle-outline', color: 'success' },
  [Operation.Update]: { icon: 'mdi-circle-edit-outline', color: '' },
  [Operation.Remove]: { icon: 'mdi-minus-circle-outline', color: 'error' },
} as const;

const props = withDefaults(defineProps<{
  revision: Revision;
  isActive?: boolean;
  isPublished?: boolean;
  isNested?: boolean;
  isExpanded?: boolean;
  childrenCount?: number;
  // Restore group: one entry standing for a whole restore cascade.
  isRestore?: boolean;
  changeCount?: number;
}>(), {
  childrenCount: 0,
  changeCount: 0,
});

defineEmits<{
  (e: 'select' | 'toggle-expand'): void;
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
  const state = props.revision.state as any;
  const activityId = (state.activityId || state.id) as number;
  return getOutlineLocation(activityStore.getParent(activityId));
});

const description = computed(() => props.isRestore
  ? 'Restored a previous version'
  : getFormatDescription(props.revision, activity.value, { omitContainer: true }),
);

const changeCountLabel = computed(
  () => `${props.changeCount} ${pluralize('change', props.changeCount)}`,
);

const date = computed(() => new Date(props.revision.createdAt));
const timeOfDay = computed(() => formatDate(date.value, 'h:mm A'));
const fullTimestamp = computed(
  () => `
    ${formatDate(date.value, 'MMMM Do, YYYY')} ${timeOfDay.value} ·
    ${formatTimeAgo(date.value, { rounding: 'floor' })}
  `,
);

const change = computed(() => {
  if (props.isRestore) return { icon: 'mdi-restore', color: 'info' };
  return CHANGE[props.revision.operation] ?? CHANGE[Operation.Update];
});

const expandLabel = computed(() => {
  const noun = pluralize(props.isRestore ? 'change' : 'edit', props.childrenCount);
  if (props.isExpanded) return `Collapse ${noun}`;
  return props.isRestore
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

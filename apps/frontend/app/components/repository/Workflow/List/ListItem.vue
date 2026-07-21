<template>
  <VCard
    ref="rootEl"
    :class="{ selected: isSelected }"
    class="list-item text-left"
    color="surface-raised"
    elevation="1"
    rounded="lg"
    @click="emit('select', activity.id)"
  >
    <span
      class="list-item__accent"
      :style="{ backgroundColor: typeConfig?.color }"
    />
    <div class="list-item__main">
      <div class="list-item__title text-body-medium text-truncate">
        <VChip
          v-if="hasMultipleWorkflowTypes"
          :text="typeConfig?.label"
          class="mr-2 text-uppercase font-weight-semibold"
          size="x-small"
        />
        <VChip
          :text="activity.shortId"
          color="secondary"
          class="mr-2 font-weight-semibold"
          size="x-small"
        />
        {{ activity.data.name }}
      </div>
    </div>
    <div class="list-item__meta d-flex align-center ga-3">
      <StatusMenu :activity="activity" />
      <AssigneeMenu :activity="activity" :size="26" compact />
      <PriorityMenu :activity="activity" compact />
      <div class="list-item__date d-flex">
        <DueDateMenu :activity="activity" />
      </div>
      <PublishingBadge :activity="activity" />
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import AssigneeMenu from '../AssigneeMenu.vue';
import DueDateMenu from '../DueDateMenu.vue';
import PriorityMenu from '../PriorityMenu.vue';
import StatusMenu from '../StatusMenu.vue';
import PublishingBadge from '../../Sidebar/PublishingBadge.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activity: StoreActivity;
}>();

const emit = defineEmits<{ select: [id: number] }>();

const { selectedActivity, workflowTypes, hasMultipleWorkflowTypes } = storeToRefs(
  useCurrentRepository(),
);

const typeConfig = computed(() =>
  workflowTypes.value.find((it: any) => it.type === props.activity.type),
);
const isSelected = computed(
  () => selectedActivity.value?.id === props.activity.id,
);

const rootEl = ref<{ $el: HTMLElement } | null>(null);
useScrollWhenSelected(() => rootEl.value?.$el, isSelected);
</script>

<style lang="scss" scoped>
.list-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.625rem 1rem 0.625rem 1.25rem;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover,
  &.selected {
    background: rgb(var(--v-theme-surface-container-high));
  }
}

.list-item__accent {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 8px;
}

.list-item__main {
  flex: 1 1 auto;
  min-width: 0;
}

.list-item__title {
  line-height: 1.3;
}

.list-item__meta {
  flex: 0 0 auto;
}

.list-item__date {
  font-variant-numeric: tabular-nums;
  width: 7rem;
}

.list-item__editable {
  cursor: pointer;
}
</style>

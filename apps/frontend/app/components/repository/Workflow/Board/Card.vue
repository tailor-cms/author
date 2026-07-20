<template>
  <VCard
    ref="rootEl"
    :class="{ selected: isSelected }"
    :ripple="false"
    class="board-card text-left"
    color="surface-raised"
    data-testid="workflow__boardCard"
    elevation="1"
    rounded="lg"
    @click="emit('select', activity.id)"
  >
    <span
      v-tooltip:bottom="hasMultipleWorkflowTypes ? typeConfig?.label : undefined"
      class="board-card__accent"
      :style="{ backgroundColor: typeConfig?.color }"
    />
    <div class="d-flex align-center ga-2 mb-2">
      <PriorityMenu :activity="activity" />
      <VSpacer />
      <span class="text-body-small text-medium-emphasis">
        {{ activity.shortId }}
      </span>
      <PublishingBadge :activity="activity" />
    </div>
    <div class="board-card__name text-body-medium font-weight-medium">
      {{ activity.data.name }}
    </div>
    <div class="d-flex align-center ga-2 mt-3">
      <AssigneeMenu :activity="activity" :size="22" compact />
      <VSpacer />
      <DueDateMenu :activity="activity" compact />
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import AssigneeMenu from '../AssigneeMenu.vue';
import DueDateMenu from '../DueDateMenu.vue';
import PriorityMenu from '../PriorityMenu.vue';
import PublishingBadge from '../../Sidebar/PublishingBadge.vue';
import { useCurrentRepository } from '@/stores/current-repository';
import { find } from 'lodash-es';

const props = defineProps<{
  activity: StoreActivity;
}>();

const emit = defineEmits<{ select: [id: number] }>();

const { selectedActivity, workflowTypes, hasMultipleWorkflowTypes } = storeToRefs(
  useCurrentRepository(),
);

const typeConfig = computed(() =>
  find(workflowTypes.value, { type: props.activity.type }),
);
const isSelected = computed(() =>
  selectedActivity.value?.id === props.activity.id,
);

const rootEl = ref<{ $el: HTMLElement } | null>(null);
useScrollWhenSelected(() => rootEl.value?.$el, isSelected);
</script>

<style lang="scss" scoped>
.board-card {
  position: relative;
  flex: 0 0 auto;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &.selected::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-color: currentColor;
    opacity: calc(var(--v-activated-opacity) * var(--v-theme-overlay-multiplier));
    pointer-events: none;
  }
}
.board-card__accent {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 4px;
}

.board-card__name {
  line-height: 1.3;
}
</style>

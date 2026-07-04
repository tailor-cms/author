<template>
  <VCard
    ref="rootEl"
    :class="{ selected: isSelected }"
    :ripple="false"
    class="board-card text-left"
    color="surface-raised"
    data-testid="workflow__boardCard"
    rounded="lg"
    variant="flat"
    elevation="1"
    @click="emit('select', activity.id)"
  >
    <span
      v-tooltip:bottom="hasMultipleWorkflowTypes ? typeConfig?.label : undefined"
      class="board-card__accent"
      :style="{ backgroundColor: typeConfig?.color }"
    />
    <div class="d-flex align-center ga-2 mb-2">
      <PriorityMenu v-if="priority" :activity="activity">
        <template #activator="{ props: menuProps }">
          <VChip
            v-bind="menuProps"
            :color="priority.color"
            class="board-card__editable"
            size="x-small"
            rounded
            @click.stop
          >
            <VIcon :icon="priority.icon" size="small" start />
            {{ priority.label }}
          </VChip>
        </template>
      </PriorityMenu>
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
      <AssigneeMenu :activity="activity">
        <template #activator="{ props: menuProps }">
          <UserAvatar
            v-bind="menuProps"
            :img-url="assignee?.imgUrl"
            :label="assignee?.label ?? 'Unassigned'"
            class="board-card__editable"
            size="22"
            @click.stop
          />
        </template>
      </AssigneeMenu>
      <VSpacer />
      <DueDate
        v-if="currentStatus.dueDate"
        :date="currentStatus.dueDate"
        class="text-body-small"
      />
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import { UserAvatar } from '@tailor-cms/core-components';
import { workflow as workflowConfig } from '@tailor-cms/config';

import AssigneeMenu from '../AssigneeMenu.vue';
import DueDate from '../DueDate.vue';
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

const currentStatus = computed(() => props.activity.currentStatus);
const assignee = computed(() => currentStatus.value.assignee);
const priority = computed(() =>
  workflowConfig.getPriority(currentStatus.value.priority),
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

// Type-colored accent, mirroring the list view so both card surfaces share
// the same type-at-a-glance language.
.board-card__accent {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 4px;
}

.board-card__name {
  line-height: 1.3;
}

// Inline-editable affordances (priority chip, assignee) — clickable without
// selecting the card.
.board-card__editable {
  cursor: pointer;
}
</style>

<template>
  <VMenu v-model="isOpen" :close-on-content-click="false">
    <template #activator="activator">
      <slot name="activator" v-bind="activator">
        <div
          v-bind="activator.props"
          :aria-label="dueDate ? `Due date: ${label}` : 'Due date'"
          class="cursor-pointer d-inline-flex align-center"
          role="button"
          tabindex="0"
          @click.stop
        >
          <DueDate v-if="dueDate" :date="dueDate" class="text-body-small" />
          <span v-else-if="emptyLabel" class="text-body-small text-disabled">
            {{ emptyLabel }}
          </span>
          <VIcon
            v-else
            v-tooltip:bottom="'Set due date'"
            class="text-medium-emphasis"
            icon="mdi-calendar-outline"
            size="small"
          />
        </div>
      </slot>
    </template>
    <VDatePicker
      :model-value="modelDate"
      show-adjacent-months
      @update:model-value="onSelect"
    >
      <template #actions>
        <VBtn
          v-if="dueDate"
          color="error"
          size="small"
          text="Clear"
          variant="text"
          @click="onClear"
        />
      </template>
    </VDatePicker>
  </VMenu>
</template>

<script lang="ts" setup>
import { formatDate } from 'date-fns/format';

import DueDate from './DueDate.vue';
import { useStatusUpdate } from './useStatusUpdate';

const props = defineProps<{
  activity: StoreActivity;
  // Empty-state text (the table uses a muted em-dash); omitted on the compact
  // cards, which fall back to the icon affordance.
  emptyLabel?: string;
}>();

const update = useStatusUpdate();

const isOpen = ref(false);
const dueDate = computed(() => props.activity.currentStatus.dueDate);
const modelDate = computed(() =>
  dueDate.value ? new Date(dueDate.value) : undefined,
);
const label = computed(() =>
  dueDate.value ? formatDate(new Date(dueDate.value), 'MMM d, yyyy') : '',
);

const onSelect = async (value: Date) => {
  isOpen.value = false;
  await update(props.activity, 'dueDate', value);
};
const onClear = async () => {
  isOpen.value = false;
  await update(props.activity, 'dueDate', null);
};
</script>

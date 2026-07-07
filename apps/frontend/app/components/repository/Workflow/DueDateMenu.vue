<template>
  <VMenu v-model="isOpen" :close-on-content-click="false">
    <template #activator="activator">
      <div
        v-bind="activator.props"
        :aria-label="dueDate ? `Due date: ${label}` : 'Due date'"
        class="cursor-pointer d-inline-flex align-center"
        role="button"
        tabindex="0"
        @click.stop
      >
        <DueDate
          v-if="dueDate"
          :date="dueDate"
          :icon-position="compact ? 'end' : 'start'"
          :status="activity.currentStatus.status"
          class="text-body-small"
        />
        <div v-else class="d-flex align-center text-disabled text-body-small">
          <VIcon icon="mdi-calendar" />
          <span v-if="!compact" class="ml-2">No due date</span>
        </div>
      </div>
    </template>
    <VDatePicker
      :model-value="modelDate"
      show-adjacent-months
      @update:model-value="onSelect"
    >
      <template #actions>
        <VBtn
          v-if="dueDate"
          :slim="false"
          color="error"
          text="Clear"
          rounded="lg"
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
  compact?: boolean;
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

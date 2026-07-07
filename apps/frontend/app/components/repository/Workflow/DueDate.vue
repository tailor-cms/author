<template>
  <div
    :class="{ 'text-disabled': completed }"
    v-bind="$attrs"
    class="d-flex align-center"
  >
    <VIcon v-if="iconPosition !== 'end'" :color="iconColor" :icon="icon" start />
    {{ formatDate(date, format) }}
    <VIcon v-if="iconPosition === 'end'" :color="iconColor" :icon="icon" end />
  </div>
</template>

<script lang="ts" setup>
import { compareAsc } from 'date-fns/compareAsc';
import { formatDate } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { sub } from 'date-fns/sub';

import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  date: string;
  format?: string;
  status?: string;
  iconPosition?: 'start' | 'end';
}

const props = withDefaults(defineProps<Props>(), {
  format: 'MMM d, yyyy',
  status: undefined,
  iconPosition: 'start',
});

const { workflow } = useCurrentRepository();

const currentDate = computed(() => formatDate(new Date(), 'yyyy-MM-dd'));
const dueDate = computed(() => formatDate(new Date(props.date), 'yyyy-MM-dd'));

const didWarningThresholdElapse = computed(() => {
  if (!workflow?.dueDateWarningThreshold) return false;
  const warningStartDate = sub(dueDate.value, workflow.dueDateWarningThreshold);
  return compareAsc(currentDate.value, warningStartDate) !== -1;
});

const completed = computed(
  () => !!workflow?.statuses?.find((it) => it.id === props.status)?.completed,
);
const elapsed = computed(() => isAfter(currentDate.value, dueDate.value));
const overdue = computed(() => !completed.value && elapsed.value);
const soon = computed(
  () => !completed.value && !elapsed.value && didWarningThresholdElapse.value,
);

const icon = computed(() => {
  if (completed.value) return 'mdi-calendar-check';
  if (overdue.value) return 'mdi-calendar-alert';
  if (soon.value) return 'mdi-calendar-clock';
  return 'mdi-calendar';
});

const iconColor = computed(() => {
  if (overdue.value) return 'error';
  if (soon.value) return 'warning';
  return undefined;
});
</script>

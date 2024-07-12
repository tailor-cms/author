<template>
  <div v-bind="$attrs" :class="{ 'text-error': elapsed, 'text-warning': soon }">
    <VIcon class="icon mr-1" icon="mdi-clock-outline" size="16" />
    <span class="text-no-wrap">{{ formatDate(date, 'MMM d, yyyy') }}</span>
  </div>
</template>

<script lang="ts" setup>
import { compareAsc } from 'date-fns/compareAsc';
import { formatDate } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { sub } from 'date-fns/sub';

import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{ date: string }>();

const { workflow } = useCurrentRepository();

const currentDate = computed(() => formatDate(new Date(), 'yyyy-MM-dd'));
const dueDate = computed(() => formatDate(new Date(props.date), 'yyyy-MM-dd'));
const elapsed = computed(() => isAfter(currentDate.value, dueDate.value));
const soon = computed(() => !elapsed.value && didWarningThresholdElapse.value);

const didWarningThresholdElapse = computed(() => {
  if (!workflow.dueDateWarningThreshold) return false;
  const warningStartDate = sub(dueDate.value, workflow.dueDateWarningThreshold);
  return compareAsc(currentDate.value, warningStartDate) !== -1;
});
</script>

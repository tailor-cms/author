<template>
  <div v-bind="$attrs" :class="{ 'text-error': elapsed, 'text-warning': soon }">
    <VIcon v-if="icon" class="icon mr-1" size="16">mdi-clock-outline</VIcon>
    <span class="text-no-wrap">{{ formatDate(value, format) }}</span>
  </div>
</template>

<script lang="ts" setup>
import { compareAsc } from 'date-fns/compareAsc';
import { formatDate } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { sub } from 'date-fns/sub';

import { useCurrentRepository } from '@/stores/current-repository';

interface Props {
  value: string;
  format: string;
  icon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  icon: false,
});

const repositoryStore = useCurrentRepository();

const currentDate = computed(() => formatDate(new Date(), 'yyyy-MM-dd'));
const dueDate = computed(() => formatDate(new Date(props.value), 'yyyy-MM-dd'));
const elapsed = computed(() => isAfter(currentDate.value, dueDate.value));
const soon = computed(() => !elapsed.value && didWarningThresholdElapse.value);

const didWarningThresholdElapse = computed(() => {
  const { dueDateWarningThreshold } = repositoryStore.workflow;
  if (!dueDateWarningThreshold) return false;
  const warningStartDate = sub(dueDate.value, dueDateWarningThreshold);
  return compareAsc(currentDate.value, warningStartDate) !== -1;
});
</script>

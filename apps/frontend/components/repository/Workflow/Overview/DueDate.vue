<template>
  <div
    :class="{ 'text-primary-lighten-3': elapsed }"
    v-bind="$attrs"
    class="d-flex align-center"
  >
    {{ formatDate(date, format) }}
    <VIcon
      v-if="soon"
      class="ml-1"
      color="amber"
      icon="mdi-alert-circle-outline"
      size="small"
    />
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
}

const props = withDefaults(defineProps<Props>(), {
  format: 'MMM d, yyyy',
});

const { workflow } = useCurrentRepository();

const currentDate = computed(() => formatDate(new Date(), 'yyyy-MM-dd'));
const dueDate = computed(() => formatDate(new Date(props.date), 'yyyy-MM-dd'));

const didWarningThresholdElapse = computed(() => {
  if (!workflow.dueDateWarningThreshold) return false;
  const warningStartDate = sub(dueDate.value, workflow.dueDateWarningThreshold);
  return compareAsc(currentDate.value, warningStartDate) !== -1;
});

const elapsed = computed(() => isAfter(currentDate.value, dueDate.value));
const soon = computed(() => !elapsed.value && didWarningThresholdElapse.value);
</script>

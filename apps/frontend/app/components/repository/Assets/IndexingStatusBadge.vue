<template>
  <VChip
    :color="`${color}-lighten-2`"
    density="compact"
    size="x-small"
    variant="tonal"
    rounded
  >
    <VIcon
      v-if="status === ProcessingStatus.Processing"
      class="mdi-spin"
      icon="mdi-loading"
      size="12"
      start
    />
    {{ label }}
  </VChip>
</template>

<script lang="ts" setup>
import { ProcessingStatus } from '@tailor-cms/interfaces/asset';

const props = defineProps<{ status: string }>();

const COLOR_MAP: Record<string, string> = {
  [ProcessingStatus.Pending]: 'amber',
  [ProcessingStatus.Processing]: 'amber',
  [ProcessingStatus.Completed]: 'green',
  [ProcessingStatus.Failed]: 'red',
};

const LABEL_MAP: Record<string, string> = {
  [ProcessingStatus.Pending]: 'Indexing pending',
  [ProcessingStatus.Processing]: 'Indexing',
  [ProcessingStatus.Completed]: 'Indexed',
  [ProcessingStatus.Failed]: 'Indexing failed',
};

const color = computed(() => COLOR_MAP[props.status] || 'grey');
const label = computed(() => LABEL_MAP[props.status] || props.status);
</script>

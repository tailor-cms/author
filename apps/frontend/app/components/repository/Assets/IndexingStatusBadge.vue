<template>
  <VChip :color="color" size="x-small" variant="flat">
    <VIcon
      v-if="status === ProcessingStatus.Processing"
      class="spin"
      icon="mdi-loading"
      size="12"
      start />
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
  [ProcessingStatus.Pending]: 'Pending',
  [ProcessingStatus.Processing]: 'Indexing',
  [ProcessingStatus.Completed]: 'Indexed',
  [ProcessingStatus.Failed]: 'Failed',
};

const color = computed(() => COLOR_MAP[props.status] || 'grey');
const label = computed(() => LABEL_MAP[props.status] || props.status);
</script>

<style scoped>
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

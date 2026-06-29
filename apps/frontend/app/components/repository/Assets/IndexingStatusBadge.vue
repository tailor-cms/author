<template>
  <VChip
    :color="color"
    :density="density"
    :size="size"
    variant="tonal"
    rounded="md"
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
import type { VChip } from 'vuetify/components/VChip';

interface Props {
  status: string;
  density?: VChip['density'];
  size?: VChip['size'];
}

const props = withDefaults(defineProps<Props>(), {
  density: 'default',
  size: 'small',
});

const COLOR_MAP: Record<string, string> = {
  [ProcessingStatus.Pending]: 'warning',
  [ProcessingStatus.Processing]: 'warning',
  [ProcessingStatus.Completed]: 'success',
  [ProcessingStatus.Failed]: 'error',
};

const LABEL_MAP: Record<string, string> = {
  [ProcessingStatus.Pending]: 'Indexing pending',
  [ProcessingStatus.Processing]: 'Indexing',
  [ProcessingStatus.Completed]: 'Indexed',
  [ProcessingStatus.Failed]: 'Indexing failed',
};

const color = computed(() => COLOR_MAP[props.status] || '');
const label = computed(() => LABEL_MAP[props.status] || props.status);
</script>

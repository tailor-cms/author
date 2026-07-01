<template>
  <VChip
    v-if="label"
    :color="color"
    :density="density"
    :size="size"
    variant="tonal"
    rounded="md"
  >
    <VIcon
      v-if="isProcessing"
      class="mdi-spin"
      icon="mdi-loading"
      size="12"
      start
    />
    {{ labelText }}
  </VChip>
  <VIcon
    v-else
    v-tooltip:top="{ text: labelText, openDelay: 200 }"
    :aria-label="labelText"
    :class="{ 'mdi-spin': isProcessing }"
    :color="color"
    :icon="icon"
    :size="size"
  />
</template>

<script lang="ts" setup>
import { ProcessingStatus } from '@tailor-cms/interfaces/asset';
import type { VChip } from 'vuetify/components/VChip';

interface Props {
  status: string;
  density?: VChip['density'];
  size?: VChip['size'];
  // Render the full text chip; defaults to a compact icon + tooltip.
  label?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  density: 'default',
  size: 'small',
  label: false,
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

const ICON_MAP: Record<string, string> = {
  [ProcessingStatus.Pending]: 'mdi-clock-outline',
  [ProcessingStatus.Processing]: 'mdi-loading',
  [ProcessingStatus.Completed]: 'mdi-check-decagram-outline',
  [ProcessingStatus.Failed]: 'mdi-alert-decagram-outline',
};

const isProcessing = computed(
  () => props.status === ProcessingStatus.Processing,
);
const color = computed(() => COLOR_MAP[props.status] || '');
const labelText = computed(() => LABEL_MAP[props.status] || props.status);
const icon = computed(() => ICON_MAP[props.status] || 'mdi-help-circle');
</script>

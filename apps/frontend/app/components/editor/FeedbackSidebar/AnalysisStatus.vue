<template>
  <div class="d-flex align-center ga-2 text-label-small text-medium-emphasis">
    <template v-if="!isRunning && computedAt">
      <div class="d-flex align-center">
        <VIcon icon="mdi-clock-outline" size="14" start />
        <span>Analyzed {{ analyzedAgo }}</span>
      </div>
      <VSpacer />
      <VChip
        v-if="isStale"
        v-tooltip:bottom="'Content changed since the last analysis'"
        color="warning"
        size="x-small"
        text="Out of date"
        variant="tonal"
        label
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

const props = defineProps<{
  isRunning: boolean;
  isStale: boolean;
  computedAt?: number | null;
}>();

const analyzedAgo = computed(() => {
  if (!props.computedAt) return '';
  return formatDistanceToNow(props.computedAt, { addSuffix: true });
});
</script>

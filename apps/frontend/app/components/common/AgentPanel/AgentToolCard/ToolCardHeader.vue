<template>
  <button
    :aria-expanded="isOpen"
    class="tool-card-header"
    @click="$emit('toggle')"
  >
    <VIcon
      v-if="isSuccess"
      class="card-status"
      color="success"
      icon="mdi-check-circle"
      size="16"
    />
    <VIcon
      v-else
      class="card-status"
      color="error"
      icon="mdi-alert-circle"
      size="16"
    />
    <code class="card-name font-weight-bold">{{ name }}</code>
    <span class="card-summary text-truncate">{{ summary }}</span>
    <span v-if="durationMs" class="card-time">{{ formatDuration(durationMs) }}</span>
    <VIcon
      :icon="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
      class="card-toggle-icon"
      size="16"
    />
  </button>
</template>

<script lang="ts" setup>
interface Props {
  name: string;
  summary: string;
  isSuccess: boolean;
  isOpen: boolean;
  durationMs: number;
}

defineProps<Props>();
defineEmits<{ toggle: [] }>();

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
</script>

<style lang="scss" scoped>
.tool-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 0;
  text-align: left;
  background: transparent;
  transition: background 80ms ease;
}

.tool-card-header:hover {
  background: rgba(var(--v-theme-surface-container), 0.5);
}

.card-summary,
.card-time {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.card-summary {
  flex: 1
}

.card-time {
  font-variant-numeric: tabular-nums;
}

.card-toggle-icon {
  opacity: 0.4;
}
</style>

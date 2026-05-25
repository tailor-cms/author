<template>
  <button class="tool-card-header" @click="$emit('toggle')">
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
    <code class="card-name">{{ name }}</code>
    <span class="card-summary">{{ summary }}</span>
    <span v-if="durationMs" class="card-time">
      {{ formatDuration(durationMs) }}
    </span>
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
  font: inherit;
  text-align: left;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: background 80ms ease;
}
.tool-card-header:hover {
  background: rgba(var(--v-theme-on-surface), 0.1);
}

.card-name {
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.75rem;
  font-weight: 600;
}

.card-summary {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  opacity: 0.55;
}

.card-time {
  opacity: 0.45;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
}

.card-toggle-icon {
  opacity: 0.4;
}
</style>

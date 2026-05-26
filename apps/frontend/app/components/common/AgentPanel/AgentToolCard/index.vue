<template>
  <div :class="['tool-card', toolCall.ok ? 'tool-card-ok' : 'tool-card-err']">
    <ToolCardHeader
      :name="toolCall.name"
      :is-success="toolCall.ok"
      :is-open="isOpen"
      :duration-ms="toolCall.durationMs"
      :summary="summary"
      @toggle="isOpen = !isOpen"
    />
    <div v-if="isOpen" class="card-body">
      <details v-if="hasInput" open>
        <summary>input</summary>
        <pre>{{ stringify(toolCall.input) }}</pre>
      </details>
      <details v-if="hasResult">
        <summary>result</summary>
        <pre>{{ stringify(toolCall.result) }}</pre>
      </details>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ToolCardHeader from './ToolCardHeader.vue';
import { getToolSummary } from './toolSummary';
import type { ToolCallRecord } from '@tailor-cms/interfaces/agent.ts';

interface Props {
  toolCall: ToolCallRecord;
}

const props = defineProps<Props>();

const isOpen = ref(false);

const hasInput = computed(() => {
  const { input } = props.toolCall;
  return input && Object.keys(input).length > 0;
});

const hasResult = computed(() => props.toolCall.result != null);

const summary = computed(() =>
  getToolSummary(props.toolCall.name, props.toolCall.result),
);

/**
 * Pretty-print a value as indented JSON for the details block. Falls
 * back to String() for values that can't be serialized (circular refs).
 */
function stringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
</script>

<style lang="scss" scoped>
.tool-card {
  overflow: hidden;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 0.625rem;
  background: rgb(var(--v-theme-surface));
  font-size: 0.75rem;
  transition: border-color 120ms ease;
}

.tool-card-ok {
  border-color: rgba(var(--v-theme-success), 0.35);
}

.tool-card-err {
  border-color: rgba(var(--v-theme-error), 0.5);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem 0.75rem;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
}

.card-body details summary {
  padding: 0.1875rem 0;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.6;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  user-select: none;
}

.card-body details summary:hover {
  opacity: 0.85;
}

.card-body details pre {
  overflow-y: auto;
  max-height: 15rem;
  margin: 0.3125rem 0 0;
  padding: 0.5rem 0.6875rem;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 0.5rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.6875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

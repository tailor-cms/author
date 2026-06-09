<template>
  <VCard
    :border="`sm opacity-50 ${toolCall.ok ? 'success' : 'error'}`"
    class="tool-card text-body-small"
    color="surface-container-low"
    elevation="0"
  >
    <ToolCardHeader
      :name="toolCall.name"
      :is-success="toolCall.ok"
      :is-open="isOpen"
      :duration-ms="toolCall.durationMs"
      :summary="summary"
      @toggle="isOpen = !isOpen"
    />
    <VExpandTransition>
      <div v-if="isOpen" class="card-body ga-2">
        <details v-if="hasInput" open>
          <summary>input</summary>
          <pre>{{ stringify(toolCall.input) }}</pre>
        </details>
        <details v-if="hasResult">
          <summary>result</summary>
          <pre>{{ stringify(toolCall.result) }}</pre>
        </details>
      </div>
    </VExpandTransition>
  </VCard>
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
  transition: border-color 120ms ease;
}

.card-body {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.75rem 0.75rem;
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
  border-radius: 0.5rem;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.6875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

<template>
  <AgentOptionMenu
    v-model="effort"
    :compact="compact"
    :options="EFFORT_OPTIONS"
    content-class="agent-panel-menu agent-effort-menu"
    label="Reasoning effort"
  />
</template>

<script lang="ts" setup>
import {
  ReasoningEffort,
  type ReasoningEffortLiteral,
} from '@tailor-cms/interfaces/ai.ts';

import AgentOptionMenu from './AgentOptionMenu.vue';

interface EffortOption {
  title: string;
  value: ReasoningEffortLiteral;
  icon: string;
  subtitle: string;
}

// Reasoning effort; only meaningful when the configured model is a
// reasoning model (gpt-5 / o-series). The backend silently ignores the
// param on non-reasoning models, so it's safe to always send.
const EFFORT_OPTIONS: EffortOption[] = [
  {
    title: 'Quick',
    value: ReasoningEffort.Minimal,
    icon: 'mdi-flash-outline',
    subtitle: 'Fastest replies, no extended reasoning',
  },
  {
    title: 'Low',
    value: ReasoningEffort.Low,
    icon: 'mdi-speedometer-slow',
    subtitle: 'Light thinking - good for simple edits',
  },
  {
    title: 'Standard',
    value: ReasoningEffort.Medium,
    icon: 'mdi-speedometer-medium',
    subtitle: 'Balanced - default for most tasks',
  },
  {
    title: 'Deep',
    value: ReasoningEffort.High,
    icon: 'mdi-brain',
    subtitle: 'Slower; for outlines, comparisons, hard analysis',
  },
];

defineProps<{ compact?: boolean }>();

const effort = defineModel<ReasoningEffortLiteral>({ required: true });
</script>

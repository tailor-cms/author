<template>
  <VSelect
    v-model="effort"
    :items="EFFORT_OPTIONS"
    :menu-props="MENU_PROPS"
    :prepend-inner-icon="activeIcon"
    class="agent-effort-select"
    density="compact"
    item-title="title"
    item-value="value"
    rounded="lg"
    variant="solo-filled"
    flat
    hide-details
  >
    <template #item="{ item, props: itemProps }">
      <VListItem
        v-bind="itemProps"
        :prepend-icon="item.raw.icon"
        :subtitle="item.raw.subtitle"
      />
    </template>
  </VSelect>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import {
  ReasoningEffort,
  type ReasoningEffortLiteral,
} from '@tailor-cms/interfaces/ai.ts';

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

const MENU_PROPS = {
  contentClass: 'agent-panel-menu agent-effort-menu',
  zIndex: 9100,
};

const effort = defineModel<ReasoningEffortLiteral>({ required: true });

const activeIcon = computed(
  () => EFFORT_OPTIONS.find((it) => it.value === effort.value)?.icon,
);
</script>

<style lang="scss" scoped>
.agent-effort-select {
  max-width: 8.125rem;

  :deep(.v-field__input) {
    font-size: 0.82rem;
    font-weight: 500;
  }
}
</style>

<template>
  <VCard class="pa-3" color="surface-container-high" rounded="lg" flat>
    <div class="d-flex align-center ga-2">
      <VChip
        :color="impactColor"
        :text="`${suggestion.impact} impact`"
        class="text-capitalize flex-shrink-0"
        size="x-small"
        variant="tonal"
        label
      />
      <span class="text-body-small font-weight-bold">
        {{ suggestion.title }}
      </span>
    </div>
    <div class="text-body-small text-medium-emphasis mt-2">
      {{ suggestion.detail }}
    </div>
    <div class="d-flex align-center flex-wrap ga-1 mt-2">
      <VChip
        v-for="label in dimensionLabels"
        :key="label"
        :text="label"
        size="x-small"
        variant="outlined"
      />
      <VSpacer />
      <VBtn
        v-if="hasTargetElement"
        density="comfortable"
        prepend-icon="mdi-target"
        size="x-small"
        text="Show element"
        variant="text"
        @click="$emit('element:show', suggestion.targetElementId)"
      />
      <VBtn
        v-if="suggestion.agentPrompt && isAgentAvailable"
        color="tertiary"
        density="comfortable"
        prepend-icon="mdi-creation"
        size="x-small"
        text="Fix with AI"
        variant="text"
        @click="$emit('agent:ask', suggestion.agentPrompt)"
      />
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import type {
  FeedbackSuggestion,
  ScoringDimensionSummary,
} from '@tailor-cms/interfaces/feedback';

const props = defineProps<{
  suggestion: FeedbackSuggestion;
  dimensions: ScoringDimensionSummary[];
  isAgentAvailable: boolean;
  hasTargetElement: boolean;
}>();

defineEmits(['element:show', 'agent:ask']);

const impactColor = computed(() => {
  const colors = { high: 'error', medium: 'warning', low: 'info' };
  return colors[props.suggestion.impact] ?? 'info';
});

const dimensionLabels = computed(() =>
  props.suggestion.dimensionKeys
    .map((key) => props.dimensions.find((it) => it.key === key)?.label)
    .filter((it): it is string => !!it),
);
</script>

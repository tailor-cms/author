<template>
  <VCard
    border="sm outline-variant"
    class="px-4 py-3"
    color="surface-container-high"
    rounded="lg"
    flat
  >
    <div class="d-flex flex-column ga-1">
      <span
        :class="`text-${impactColor}`"
        class="impact-label font-weight-bold text-uppercase"
      >
        {{ suggestion.impact }} impact
      </span>
      <span class="text-title-small font-weight-bold mb-1">
        {{ suggestion.title }}
      </span>
    </div>
    <div class="text-body-small text-medium-emphasis">
      {{ suggestion.detail }}
    </div>
    <div class="d-flex align-center ga-1 mt-2">
      <div class="d-flex flex-wrap ga-1">
        <VChip
          v-for="label in dimensionLabels"
          :key="label"
          :text="label"
          size="x-small"
        />
      </div>
      <VSpacer />
      <div class="d-flex justify-end flex-wrap ga-1">
        <VBtn
          v-if="hasTargetElement"
          prepend-icon="mdi-target"
          size="x-small"
          text="Show element"
          variant="text"
          @click="$emit('element:show', suggestion.targetElementId)"
        />
        <VBtn
          v-if="suggestion.agentPrompt && isAgentAvailable"
          color="secondary"
          prepend-icon="mdi-creation"
          size="x-small"
          text="Fix with AI"
          variant="text"
          @click="$emit('agent:ask', suggestion.agentPrompt)"
        />
      </div>
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import type {
  FeedbackSuggestion,
  RubricDimension,
} from '@tailor-cms/interfaces/feedback';

const props = defineProps<{
  suggestion: FeedbackSuggestion;
  dimensions: RubricDimension[];
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

<style lang="scss" scoped>
.impact-label {
  font-size: 0.625rem;
  letter-spacing: 0.0625rem;
}
</style>

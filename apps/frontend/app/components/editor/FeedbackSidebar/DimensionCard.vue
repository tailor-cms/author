<template>
  <VExpansionPanel
    class="border-outline-variant border-sm"
    bg-color="surface-container-high"
    elevation="0"
    rounded="lg"
  >
    <VExpansionPanelTitle class="pa-3" static>
      <div class="d-flex align-center ga-3 flex-grow-1">
        <VAvatar
          :icon="dimension.icon"
          rounded="lg"
          size="34"
          variant="tonal"
        />
        <div class="flex-grow-1">
          <div class="text-title-small font-weight-bold">
            {{ dimension.label }}
          </div>
          <VProgressLinear
            :color="scoreColor"
            :max="dimension.maxScore"
            :model-value="score"
            class="mt-1"
            height="6"
            rounded
          />
        </div>
        <span class="text-label-medium font-weight-bold score-text">
          {{ score }}/{{ dimension.maxScore }}
        </span>
      </div>
    </VExpansionPanelTitle>
    <VExpansionPanelText v-if="assessment" class="px-0">
      <div class="text-body-small text-medium-emphasis mb-2">
        {{ assessment.rationale }}
      </div>
      <blockquote
        v-for="(quote, index) in assessment.evidence"
        :key="index"
        class="evidence text-body-small text-medium-emphasis"
      >
        {{ quote }}
      </blockquote>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>

<script lang="ts" setup>
import type {
  FeedbackDimensionScore,
  RubricDimension,
} from '@tailor-cms/interfaces/feedback';

const props = defineProps<{
  dimension: RubricDimension;
  // The AI's scored assessment of this dimension
  assessment?: FeedbackDimensionScore | null;
}>();

const score = computed(() => props.assessment?.score ?? 0);

const scoreColor = computed(() => {
  const { maxScore } = props.dimension;
  const ratio = maxScore ? score.value / maxScore : 0;
  if (ratio >= 0.75) return 'success';
  if (ratio >= 0.4) return 'warning';
  return 'error';
});
</script>

<style lang="scss" scoped>
.v-expansion-panel-title {
  min-height: 0;
}

.score-text {
  white-space: nowrap;
}

.evidence {
  border-left: 3px solid rgb(var(--v-theme-outline));
  background: rgb(var(--v-theme-surface-container-highest));
  margin-top: 0.25rem;
  padding: 0.375rem 0.5rem;
  font-style: italic;
  border-radius: 2px;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0.5rem 1rem 1rem;
}
</style>

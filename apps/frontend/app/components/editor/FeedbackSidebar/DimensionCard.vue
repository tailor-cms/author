<template>
  <VExpansionPanel bg-color="surface-container-high" elevation="0" rounded="lg">
    <VExpansionPanelTitle class="pa-3" static>
      <div class="d-flex align-center ga-3 flex-grow-1">
        <VAvatar
          :icon="dimension.icon"
          color="tertiary"
          size="34"
          variant="tonal"
        />
        <div class="flex-grow-1">
          <div class="text-body-small font-weight-bold">
            {{ dimension.label }}
          </div>
          <VProgressLinear
            :color="scoreColor"
            :max="dimension.maxScore"
            :model-value="score"
            bg-color="surface-container-highest"
            class="mt-1"
            height="6"
            rounded
          />
        </div>
        <span class="text-label-large font-weight-bold score-text">
          {{ score }}/{{ dimension.maxScore }}
        </span>
      </div>
    </VExpansionPanelTitle>
    <VExpansionPanelText v-if="assessment">
      <div class="text-body-small text-medium-emphasis">
        {{ assessment.rationale }}
      </div>
      <blockquote
        v-for="(quote, index) in assessment.evidence"
        :key="index"
        class="evidence text-body-small text-medium-emphasis mt-2 pl-3"
      >
        {{ quote }}
      </blockquote>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>

<script lang="ts" setup>
import type {
  FeedbackDimensionScore,
  ScoringDimensionSummary,
} from '@tailor-cms/interfaces/feedback';

const props = defineProps<{
  dimension: ScoringDimensionSummary;
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
  border-left: 2px solid rgb(var(--v-theme-outline));
  font-style: italic;
}
</style>

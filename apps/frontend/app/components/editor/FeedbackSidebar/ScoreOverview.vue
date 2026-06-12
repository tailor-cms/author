<template>
  <div class="d-flex flex-column ga-4">
    <div class="d-flex align-center ga-4">
      <VProgressCircular
        :model-value="scorePercentage"
        :color="scoreColor"
        bg-color="surface-container-highest"
        class="score-ring flex-shrink-0"
        size="92"
        width="6"
      >
        <span class="score-value font-weight-bold">
          {{ result.overall.score }}
          <span class="max-score">/{{ result.overall.maxScore }}</span>
        </span>
      </VProgressCircular>
      <div class="d-flex flex-column ga-1">
        <div class="text-body-medium font-weight-bold">
          {{ result.overall.headline }}
        </div>
        <VChip
          v-if="trendDelta !== null"
          :color="trendDelta >= 0 ? 'success' : 'error'"
          :prepend-icon="trendDelta >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
          :text="trendLabel"
          class="align-self-start"
          size="x-small"
          variant="tonal"
          label
        />
      </div>
    </div>
    <div class="text-body-small text-medium-emphasis">
      {{ result.overall.summary }}
    </div>
    <RadarChart :data="chartData" :max="4" :min="0" />
  </div>
</template>

<script lang="ts" setup>
import { RadarChart } from '@tailor-cms/core-components';
import type {
  FeedbackResult,
  FeedbackTrendPoint,
  RubricDimension,
} from '@tailor-cms/interfaces/feedback';
import { useTheme } from 'vuetify';

const props = defineProps<{
  result: FeedbackResult;
  trend: FeedbackTrendPoint[];
  dimensions: RubricDimension[];
}>();

const theme = useTheme();
const colors = computed(() => theme.current.value.colors);

const scorePercentage = computed(() => {
  const { score, maxScore } = props.result.overall;
  return maxScore ? (score / maxScore) * 100 : 0;
});

const scoreColor = computed(() => {
  if (scorePercentage.value >= 75) return 'success';
  if (scorePercentage.value >= 40) return 'warning';
  return 'error';
});

// Score delta vs the previous analysis, null when there is no history.
const trendDelta = computed(() => {
  if (props.trend.length < 2) return null;
  const [previous, current] = props.trend.slice(-2);
  return current!.score - previous!.score;
});

const trendLabel = computed(() => {
  if (trendDelta.value === null) return '';
  if (!trendDelta.value) return 'No change since last analysis';
  const direction = trendDelta.value > 0 ? '+' : '';
  return `${direction}${trendDelta.value} since last analysis`;
});

// Scores normalized to the chart's 0-4 scale so dimensions with
// different maximums stay comparable
const chartData = computed(() => {
  const scoreByKey = Object.fromEntries(
    props.result.dimensions.map((it) => [it.key, it]),
  );
  const normalized = props.dimensions.map(({ key }) => {
    const dimension = scoreByKey[key];
    if (!dimension?.maxScore) return 0;
    return (dimension.score / dimension.maxScore) * 4;
  });
  return {
    labels: props.dimensions.map((it) => it.label.split(' ')),
    datasets: [
      {
        data: normalized,
        // Vuetify theme colors resolve to 6-digit hex, so appending a
        // 2-digit hex alpha yields an 8-digit #RRGGBBAA color:
        // 40 = 25% opacity fill, BF = 75% opacity border.
        backgroundColor: `${colors.value['on-surface']}40`,
        borderColor: `${colors.value.outline}BF`,
        borderWidth: 1,
      },
    ],
  };
});
</script>

<style lang="scss" scoped>
// Explicit sizes keep two-digit scores ("12/19") inside the ring
// instead of inheriting typography that overflows it.
.score-value {
  font-size: 1.125rem;
  line-height: 1;
  white-space: nowrap;
}

.max-score {
  font-size: 0.7em;
  opacity: 0.6;
}
</style>

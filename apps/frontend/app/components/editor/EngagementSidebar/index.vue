<template>
  <VNavigationDrawer
    width="380"
    class="sidebar"
    color="surface-container"
    elevation="0"
    location="right"
    border="l"
    mobile-breakpoint="lg"
  >
    <div class="sidebar-container pa-4">
      <div class="text-body-medium font-weight-bold mt-2 mb-4">
        High Engagement at Scale
      </div>
      <VList>
        <VListItem
          v-for="it in guidelines"
          :key="it.id"
          :subtitle="it.description"
          :title="it.title"
          class="pa-4 bg-surface-container-high"
          rounded="lg"
        >
          <template #prepend>
            <VBadge
              color="highlight"
              icon="mdi-check-bold"
              :model-value="progress?.[it.id] ?? false"
            >
              <VAvatar :icon="it.icon" variant="tonal" />
            </VBadge>
          </template>
          <VDivider class="my-3" />
          <div class="d-flex flex-wrap ga-1">
            <template v-for="(metric, key) in it.metric" :key="key">
              <div
                v-if="metric"
                class="d-flex align-center text-label-medium text-medium-emphasis"
              >
                <VAvatar
                  class="font-weight-bold mr-2"
                  :color="progress?.[it.id] ? 'highlight' : 'inverse-surface'"
                  :text="`+${metric}`"
                  variant="tonal"
                  size="x-small"
                />
                {{ startCase(key) }}
              </div>
            </template>
          </div>
        </VListItem>
      </VList>
      <RadarChart :data="chartData" :max="4" :min="0" />
    </div>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import { startCase, sumBy } from 'lodash-es';
import { useTheme } from 'vuetify';
import { RadarChart } from '@tailor-cms/core-components';
import type { Guideline } from '@tailor-cms/interfaces/schema';

type GuidelineProgress = Record<Guideline['id'], boolean>;

const editorStore = useEditorStore();
const theme = useTheme();

const colors = computed(() => theme.current.value.colors);
const guidelines = computed(() => editorStore.guidelines);
const progress = computed(() => {
  return guidelines.value?.reduce<GuidelineProgress>((acc, it) => {
    acc[it.id] = it.isDone();
    return acc;
  }, {});
});

const ratings = computed(() => {
  const completed = guidelines.value?.filter((it) => progress.value?.[it.id]);
  return {
    learnerCenteredContent: sumBy(completed, 'metric.learnerCenteredContent'),
    activeLearning: sumBy(completed, 'metric.activeLearning'),
    unboundedInclusion: sumBy(completed, 'metric.unboundedInclusion'),
    communityConnections: sumBy(completed, 'metric.communityConnections'),
    realWorldOutcomes: sumBy(completed, 'metric.realWorldOutcomes'),
  };
});

const heasParams = [
  { key: 'learnerCenteredContent', label: 'Learner Centered Content' },
  { key: 'activeLearning', label: 'Active Learning' },
  { key: 'unboundedInclusion', label: 'Unbounded Inclusion' },
  { key: 'communityConnections', label: 'Community Connections' },
  { key: 'realWorldOutcomes', label: 'Real-World Outcomes' },
] as const;

const chartData = computed(() => ({
  labels: heasParams.map((it) => it.label.split(' ')),
  datasets: [
    {
      data: heasParams.map(({ key }) => ratings.value[key] || 0),
      backgroundColor: `${colors.value['on-surface']}40`,
      borderColor: `${colors.value.outline}BF`,
      borderWidth: 1,
    },
    {
      data: [4, 3, 3, 2, 3],
      backgroundColor: `${colors.value['on-surface']}40`,
      borderColor: `${colors.value.outline}BF`,
      borderWidth: 1,
    },
  ],
}));
</script>

<style lang="scss" scoped>
.sidebar {
  text-align: left;

  :deep(.v-navigation-drawer__content) {
    -ms-overflow-style: none;
    /* IE and Edge */
    scrollbar-width: none;
    /* Firefox */

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .v-btn--disabled {
    opacity: 0.35;
  }
}

.sidebar-container {
  height: 100%;

  :deep(.activity-discussion) {
    margin: 1rem 0;
    padding: 1rem;
    border: none;
  }
}

.v-list-item + .v-list-item {
  margin-top: 0.25rem;
}

:deep(.v-list-item.v-list-item--one-line .v-list-item-subtitle) {
  -webkit-line-clamp: unset;
}

:deep(.v-list-item__prepend) {
  align-self: flex-start;
}
</style>

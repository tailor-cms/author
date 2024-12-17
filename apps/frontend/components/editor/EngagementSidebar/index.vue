<template>
  <VNavigationDrawer
    width="380"
    class="sidebar"
    color="primary-darken-2"
    elevation="5"
    location="right"
    permanent
  >
    <div class="sidebar-container pa-4">
      <div class="text-body-2 font-weight-bold text-primary-lighten-4 my-4">
        High Engagement at Scale
      </div>
      <VList>
        <VListItem
          v-for="(it) in guidelines"
          :key="it.id"
          :subtitle="it.description"
          :title="it.title"
          class="pa-4"
          variant="tonal"
          rounded
        >
          <template #prepend>
            <VBadge
              color="lime-accent-4"
              icon="mdi-check-bold"
              :model-value="progress[it.id]"
            >
              <VAvatar variant="tonal">
                <VIcon>{{ it.icon }}</VIcon>
              </VAvatar>
            </VBadge>
          </template>
          <VDivider class="my-3" />
          <div class="d-flex flex-wrap ga-1">
            <template v-for="(metric, key) in it.metric" :key="key">
              <VChip v-if="metric" size="small" rounded="pill" pill>
                <VAvatar
                  class="font-weight-bold"
                  :color="progress[it.id] ? 'lime-accent-4' : 'white'"
                  variant="tonal"
                  start
                >
                  +{{ metric }}
                </VAvatar>
                {{ startCase(key) }}
              </VChip>
            </template>
          </div>
        </VListItem>
      </VList>
      <RadarChart :data="chartData" :max="4" :min="0" dark />
    </div>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import sumBy from 'lodash/sumBy';
import startCase from 'lodash/startCase';
import { RadarChart } from '@tailor-cms/core-components';

const repositoryStore = useCurrentRepository();

const guidelines = computed(() => repositoryStore.selectedActivityGuidelines);
const progress = computed(() => {
  const completed = guidelines.value.reduce((acc, it) => {
    acc[it.id] = it.isDone();
    return acc;
  }, {});
  return completed;
});

const ratings = computed(() => {
  const completed = guidelines.value.filter(
    (it: any) => progress.value[it.id],
  );
  return {
    learnerCenteredContent: sumBy(completed, 'metric.learnerCenteredContent'),
    activeLearning: sumBy(completed, 'metric.activeLearning'),
    unboundedInclusion: sumBy(completed, 'metric.unboundedInclusion'),
    communityConnections: sumBy(completed, 'metric.communityConnections'),
    realWorldOutcomes: sumBy(completed, 'metric.realWorldOutcomes'),
  };
});

const haesParams = [
  { key: 'learnerCenteredContent', label: 'Learner Centered Content' },
  { key: 'activeLearning', label: 'Active Learning' },
  { key: 'unboundedInclusion', label: 'Unbounded Inclusion' },
  { key: 'communityConnections', label: 'Community Connections' },
  { key: 'realWorldOutcomes', label: 'Real-World Outcomes' },
];

const chartData = computed(() => ({
  labels: haesParams.map((it) => it.label.split(' ')),
  datasets: [
    {
      data: haesParams.map(({ key }) => ratings.value[key]),
      backgroundColor: '#ECEFF140',
      borderColor: '#ECEFF1BF',
      borderWidth: 1,
    },
    {
      data: [4, 3, 3, 2, 3],
      backgroundColor: '#ECEFF140',
      borderColor: '#ECEFF1BF',
      borderWidth: 1,
    },
  ],
}));
</script>

<style lang="scss" scoped>
.sidebar {
  text-align: left;

  :deep(.v-navigation-drawer__content) {
    -ms-overflow-style: none !important;
    /* IE and Edge */
    scrollbar-width: none !important;
    /* Firefox */

    &::-webkit-scrollbar {
      display: none !important;
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

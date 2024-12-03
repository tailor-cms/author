<template>
  <VNavigationDrawer
    :width="lgAndUp ? 480 : 380"
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
          v-for="(it, index) in checklist"
          :key="it.id"
          :subtitle="it.description"
          :title="it.title"
          class="pa-4"
          variant="tonal"
          rounded
          @click="checklist[index].isDone = !checklist[index].isDone"
        >
          <template #prepend>
            <VBadge color="success" icon="mdi-check-bold" :model-value="it.isDone">
              <VAvatar variant="tonal">
                <VIcon>{{ it.icon }}</VIcon>
              </VAvatar>
            </VBadge>
          </template>
          <VDivider class="my-3" />
          <div class="d-flex flex-wrap ga-1">
            <template v-for="(metric, key) in it.metric" :key="key">
              <VChip v-if="metric" size="small" rounded="pill">
                {{ startCase(key) }}: +{{ metric }}
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
import { useDisplay } from 'vuetify';
import sumBy from 'lodash/sumBy';
import startCase from 'lodash/startCase';
import { RadarChart } from '@tailor-cms/core-components';

const { lgAndUp } = useDisplay();

const checklist = ref([
  {
    id: '1',
    icon: 'mdi-target',
    title: 'Define Learning Objectives',
    description: `Improve on Learner-Centered Content by defining what learners
    will gain by engaging with this content. This helps them start out with a
    clear goal and focus.`,
    metric: {
      learnerCenteredContent: 2,
      activeLearning: 0,
      unboundedInclusion: 0,
      communityConnections: 0,
      realWorldOutcomes: 0,
    },
    isDone: true,
  },
  {
    id: '2',
    icon: 'mdi-link-variant',
    title: 'Link to Related Resources',
    description: `Improve on Learner-Centered Content by linking to additional
    materials, such as articles, videos, or tools that further learners'
    understanding or provide alternative perspectives on the topic.`,
    metric: {
      learnerCenteredContent: 1,
      activeLearning: 0,
      unboundedInclusion: 0,
      communityConnections: 0,
      realWorldOutcomes: 0,
    },
    isDone: true,
  },
  {
    id: '3',
    icon: 'mdi-help-circle',
    title: 'Add a Knowledge Check',
    description: `Improve on Active Learning by incorporating a question or
    reflection prompt to help learners apply and test their understanding of
    the material.`,
    metric: {
      learnerCenteredContent: 0,
      activeLearning: 2,
      unboundedInclusion: 0,
      communityConnections: 0,
      realWorldOutcomes: 0,
    },
    isDone: true,
  },
  {
    id: '4',
    icon: 'mdi-file-pdf-box',
    title: 'Add a PDF Takeaway',
    description: `Improve on Real-World Outcomes by offering a downloadable
    summary, guide, or other resource that learners can keep for future
    reference.`,
    metric: {
      learnerCenteredContent: 0,
      activeLearning: 0,
      unboundedInclusion: 0,
      communityConnections: 0,
      realWorldOutcomes: 2,
    },
    isDone: true,
  },
  {
    id: '5',
    icon: 'mdi-file-document',
    title: 'Add a Video Transcript',
    description: `Improve on Unbounded Inclusion by ensuring all learners,
    including those with auditory impairments or who prefer reading, can fully
    engage with the content.`,
    metric: {
      learnerCenteredContent: 0,
      activeLearning: 0,
      unboundedInclusion: 2,
      communityConnections: 1,
      realWorldOutcomes: 0,
    },
    isDone: true,
  },
]);

const ratings = computed(() => {
  const completed = checklist.value.filter((it) => it.isDone);
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

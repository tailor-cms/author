<template>
  <div class="repo-container">
    <div class="mb-1 primary-darken-2 elevation-1">
      <VTabs
        bg-color="primary-darken-3"
        class="text-primary-lighten-3"
        color="primary-lighten-1"
        data-testid="repositoryRoot_nav"
        elevation="1"
        height="64"
        slider-color="primary-lighten-3"
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.name"
          :to="{ name: tab.route, query: tab.query }"
          class="px-10"
          color="primary-lighten-3"
        >
          <VIcon class="text-primary-lighten-2" start>
            mdi-{{ tab.icon }}
          </VIcon>
          {{ tab.name }}
        </VTab>
      </VTabs>
    </div>
    <div class="tab-content">
      <NuxtPage />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  middleware: ['auth'],
});

const currentRepositoryStore = useCurrentRepository();

useHead({
  title: currentRepositoryStore.repository?.name,
  meta: [{ name: 'description', content: 'Tailor CMS - Repository page' }],
});

const getTabItems = ({
  hasActivities,
  hasSettingsAvailable,
  hasWorkflow,
  query,
}: {
  hasActivities: boolean;
  hasSettingsAvailable: boolean;
  hasWorkflow: boolean;
  query: any;
}) =>
  [
    {
      name: 'Structure',
      route: 'repository',
      icon: 'file-tree',
    },
    hasActivities &&
      hasWorkflow && {
        name: 'Progress',
        route: 'progress',
        icon: 'chart-timeline-variant',
      },
    hasActivities && {
      name: 'History',
      route: 'revisions',
      icon: 'history',
    },
    hasSettingsAvailable && {
      name: 'Settings',
      route: 'repository-settings-general',
      icon: 'cog',
    },
  ]
    .filter(Boolean)
    .map((tab) => ({ ...tab, query }));

const tabs = computed(() => {
  return getTabItems({
    hasSettingsAvailable: !!currentRepositoryStore.repository?.hasAdminAccess,
    hasWorkflow: false,
    hasActivities: !!currentRepositoryStore.activities.length,
    query: {},
  });
});
</script>

<style lang="scss" scoped>
.repo-container,
.tab-content {
  width: 100%;
  height: 100%;
}

.repo-container {
  display: flex;
  flex-direction: column;

  .tab-content {
    overflow-y: scroll;
    overflow-y: overlay;
  }
}
</style>

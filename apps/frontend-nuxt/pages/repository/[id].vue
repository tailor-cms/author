<template>
  <NuxtLayout name="main">
    <div class="repo-container">
      <div class="primary-darken-3 elevation-2">
        <VTabs
          bg-color="primary-darken-3"
          class="text-primary-lighten-3"
          color="primary-lighten-1"
          height="64"
          slider-color="primary-lighten-3"
        >
          <VTab
            v-for="tab in tabs"
            :key="tab.name"
            :to="{ name: tab.route, query: tab.query }"
            class="px-8"
            color="primary-lighten-3"
          >
            <VIcon class="text-primary-lighten-1" start>
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
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth';
import { useCurrentRepository } from '@/stores/current-repository';

const authStore = useAuthStore();
const currentRepositoryStore = useCurrentRepository();

await authStore.fetchUserInfo();
await currentRepositoryStore.initialize();

const getTabItems = ({
  hasWorkflow,
  hasSettingsAvailable,
  hasActivities,
  query,
}: {
  hasWorkflow: boolean;
  hasSettingsAvailable: boolean;
  hasActivities: boolean;
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
      route: 'repository-settings',
      icon: 'cog',
    },
  ]
    .filter(Boolean)
    .map((tab) => ({ ...tab, query }));

const tabs = computed(() => {
  const hasSettingsAvailable =
    !!currentRepositoryStore.repository?.hasAdminAccess;
  const hasActivities = !!currentRepositoryStore.activities.length;
  // const activityId = get(lastSelectedActivity.value, 'id');
  // const query = { ...$route.query, ...activityId && { activityId } };
  return getTabItems({
    hasSettingsAvailable,
    hasWorkflow: false,
    hasActivities,
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

<template>
  <div class="repo-container">
    <div class="toolbar d-flex mb-1 elevation-1 align-center pr-2">
      <VTabs
        bg-color="primary-darken-3"
        class="text-primary-lighten-4"
        color="primary-lighten-1"
        data-testid="repositoryRoot_nav"
        elevation="1"
        height="64"
        slider-color="primary-lighten-3"
        mobile
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.name"
          :to="{ name: tab.route, query: tab.query }"
          class="px-md-10"
          color="primary-lighten-4"
          min-width="72"
        >
          <VIcon :icon="`mdi-${tab.icon}`" class="text-primary-lighten-3" />
          <div v-if="smAndUp" class="ml-2">{{ tab.name }}</div>
        </VTab>
      </VTabs>
      <VSpacer />
      <ActiveUsers :users="activeUsers" class="mr-4" size="36" />
      <VBtn
        v-if="smAndDown && hasSidebar"
        icon="mdi-menu"
        variant="text"
        color="white"
        @click="store.updateSidebar(!store.isSidebarOpen)"
      />
    </div>
    <div class="tab-content">
      <NuxtPage />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ActiveUsers } from '@tailor-cms/core-components';

import { useCurrentRepository } from '@/stores/current-repository';
import { useUserTracking } from '@/stores/user-tracking';
import { useDisplay } from 'vuetify';

definePageMeta({
  middleware: ['auth'],
});

const store = useCurrentRepository();
const userTrackingStore = useUserTracking();
const { smAndDown, smAndUp } = useDisplay();
const route = useRoute();

useHead({
  title: store.repository?.name,
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
    {
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

const hasSidebar = computed(() => {
  const routeName = route.name;
  return routeName === 'repository' || routeName === 'progress';
});

const tabs = computed(() => {
  return getTabItems({
    hasSettingsAvailable: !!store.repository?.hasAdminAccess,
    hasWorkflow: !!store.workflow,
    hasActivities: !!store.activities.length,
    query: {},
  });
});

const activeUsers = computed(() => {
  return userTrackingStore.getActiveUsers(
    'repository',
    store.repositoryId as number,
  );
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

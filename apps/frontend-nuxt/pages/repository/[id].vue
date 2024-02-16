<template>
  <NuxtLayout name="main">
    <div v-if="isLoading" class="pt-16">
      <VProgressCircular
        bg-color="primary"
        color="primary-darken-4"
        size="68"
        indeterminate
      >
        <template #default>
          <img
            alt="Tailor logo"
            class="pt-1"
            height="52"
            src="/img/default-logo-full.svg"
            width="32"
          />
        </template>
      </VProgressCircular>
    </div>
    <div v-else class="repo-container">
      <div class="primary-darken-2 elevation-1 mb-1">
        <VTabs
          bg-color="primary-darken-3"
          class="text-primary-lighten-3"
          color="primary-lighten-1"
          elevation="2"
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
import { promiseTimeout } from '@vueuse/core';

import { useAuthStore } from '@/stores/auth';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  middleware: ['auth'],
});

const authStore = useAuthStore();
const currentRepositoryStore = useCurrentRepository();

const isLoading = ref(true);

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
      route: 'repository-settings',
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

onMounted(async () => {
  const route = useRoute();
  const repositoryId = parseInt(route.params.id as string, 10);
  await Promise.all([
    authStore.fetchUserInfo(),
    currentRepositoryStore.initialize(repositoryId),
    await promiseTimeout(1500),
  ]);
  isLoading.value = false;
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

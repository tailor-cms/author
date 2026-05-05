<template>
  <VNavigationDrawer
    width="92"
    class="navigation-rail"
    color="primary-darken-3"
    elevation="0"
    border="none"
    location="left"
    permanent
  >
    <VTabs
      :model-value="activeTab"
      class="rail-tabs"
      color="primary-lighten-4"
      direction="vertical"
      height="68"
      stacked
    >
      <VTab
        v-for="tab in repositoryTabs"
        :key="tab.key"
        :prepend-icon="`mdi-${tab.icon}`"
        :text="tab.label"
        :to="tab.to"
        :value="tab.key"
        class="pa-2"
        rounded="0"
      />
    </VTabs>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router';

import { useCurrentRepository } from '@/stores/current-repository';

interface RailTab {
  key: string;
  label: string;
  icon: string;
  to: RouteLocationRaw;
  matches: (routeName: string) => boolean;
}

const route = useRoute();
const repoStore = useCurrentRepository();

const lastEditorActivity = useLastEditorActivity();
const { $schemaService } = useNuxtApp() as any;

const isEditable = (activity: any) =>
  !!activity && $schemaService.isEditable(activity.type);

const editorActivityId = computed(() => {
  const id = repoStore.repositoryId;
  if (!id) return null;
  const saved = lastEditorActivity.get(id);
  const savedActivity = saved
    ? repoStore.outlineActivities.find((a: any) => a.id === saved)
    : null;
  if (isEditable(savedActivity)) return saved;
  return repoStore.outlineActivities.find(isEditable)?.id ?? null;
});

const repositoryTabs = computed<RailTab[]>(() => {
  const id = repoStore.repositoryId;
  if (!id) return [];

  const items: RailTab[] = [
    {
      key: 'structure',
      label: 'Structure',
      icon: 'file-tree',
      to: { name: 'repository', params: { id } },
      matches: (name) => name === 'repository',
    },
  ];

  if (editorActivityId.value) {
    items.push({
      key: 'editor',
      label: 'Editor',
      icon: 'text-box-edit',
      to: {
        name: 'editor',
        params: { id, activityId: editorActivityId.value },
      },
      matches: (name) => name === 'editor',
    });
  }

  if (repoStore.activities.length && repoStore.workflow) {
    items.push({
      key: 'progress',
      label: 'Progress',
      icon: 'chart-timeline-variant',
      to: { name: 'progress', params: { id } },
      matches: (name) => name === 'progress',
    });
  }

  items.push(
    {
      key: 'history',
      label: 'History',
      icon: 'history',
      to: { name: 'revisions', params: { id } },
      matches: (name) => name === 'revisions',
    },
    {
      key: 'assets',
      label: 'Assets',
      icon: 'folder-multiple-image',
      to: { name: 'repository-assets', params: { id } },
      matches: (name) => name === 'repository-assets',
    },
  );

  if (repoStore.repository?.hasAdminAccess) {
    items.push({
      key: 'settings',
      label: 'Settings',
      icon: 'cog',
      to: { name: 'repository-settings-general', params: { id } },
      matches: (name) => name.startsWith('repository-settings'),
    });
  }

  return items;
});

const activeTab = computed(() => {
  const current = String(route.name ?? '');
  return repositoryTabs.value.find((tab) => tab.matches(current))?.key;
});
</script>

<style lang="scss" scoped>
.navigation-rail {
  text-align: center;
}

.rail-tabs {
  :deep(.v-tab) {
    min-width: unset;
    justify-content: center;
    font-size: 0.75rem;
    letter-spacing: normal;
    text-transform: none;
  }
}
</style>

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
      class="rail-tabs"
      color="white"
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
}

const route = useRoute();
const repoStore = useCurrentRepository();

const lastEditorActivity = useLastEditorActivity();
const { $schemaService } = useNuxtApp() as any;

const isEditable = (activity: any) =>
  !!activity && $schemaService.isEditable(activity.type);

const editorActivityId = computed(() => {
  const { repositoryId: id, outlineActivities } = repoStore;
  if (!id) return null;
  const saved = lastEditorActivity.get(id);
  const activity = id ? outlineActivities.find((a: any) => a.id === id) : null;
  if (isEditable(activity)) return saved;
  return repoStore.outlineActivities.find(isEditable)?.id ?? null;
});

const carriedActivityQuery = computed(() => {
  if (route.name !== 'editor') return undefined;
  const id = Number(route.params.activityId) || null;
  return id ? { activityId: String(id) } : undefined;
});

const repositoryTabs = computed<RailTab[]>(() => {
  const id = repoStore.repositoryId;
  if (!id) return [];

  const items: RailTab[] = [
    {
      key: 'structure',
      label: 'Structure',
      icon: 'file-tree',
      to: {
        name: 'repository',
        params: { id },
        query: carriedActivityQuery.value,
      },
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
    });
  }

  if (repoStore.activities.length && repoStore.workflow) {
    items.push({
      key: 'progress',
      label: 'Progress',
      icon: 'chart-timeline-variant',
      to: {
        name: 'progress',
        params: { id },
        query: carriedActivityQuery.value,
      },
    });
  }

  items.push(
    {
      key: 'history',
      label: 'History',
      icon: 'history',
      to: { name: 'revisions', params: { id } },
    },
    {
      key: 'assets',
      label: 'Assets',
      icon: 'folder-multiple-image',
      to: { name: 'repository-assets', params: { id } },
    },
  );

  if (repoStore.repository?.hasAdminAccess) {
    items.push({
      key: 'settings',
      label: 'Settings',
      icon: 'cog',
      to: { name: 'repository-settings-general', params: { id } },
    });
  }

  return items;
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

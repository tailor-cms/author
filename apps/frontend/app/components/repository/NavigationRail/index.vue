<template>
  <VNavigationDrawer
    width="76"
    class="navigation-rail"
    color="primary-darken-4"
    elevation="0"
    location="left"
    border="none"
    permanent
  >
    <VTabs
      class="rail-tabs"
      color="primary-lighten-4"
      direction="vertical"
      height="60"
      stacked
    >
      <VTab
        v-for="tab in repositoryTabs"
        :key="tab.key"
        :active="tab.matches?.(String(route.name ?? ''))"
        :prepend-icon="`mdi-${tab.icon}`"
        :text="tab.label"
        :to="tab.to"
        class="rail-tab mb-1"
        rounded="lg"
      />
    </VTabs>
    <template #append>
      <ActiveUsersGroup
        :users="activeUsers"
        class="rail-active-users pa-2"
        :limit="4"
        :size="32"
        vertical
      />
      <VMenu v-if="actions.length" location="end" offset="8">
        <template #activator="{ props: menuProps }">
          <VBtn
            v-bind="menuProps"
            class="rail-menu-btn ma-2"
            color="white"
            icon="mdi-dots-horizontal"
            size="small"
            variant="tonal"
          />
        </template>
        <VList density="compact" min-width="200" nav>
          <VListItem
            v-for="action in actions"
            :key="action.name"
            :base-color="action.color"
            :prepend-icon="`mdi-${action.icon}`"
            :title="action.label"
            rounded="lg"
            @click="emit('action', action.name)"
          />
        </VList>
      </VMenu>
    </template>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import { ActiveUsersGroup } from '@tailor-cms/core-components';
import type { RouteLocationRaw } from 'vue-router';

import { useCurrentRepository } from '@/stores/current-repository';
import { useUserTracking } from '@/stores/user-tracking';

interface RailTab {
  key: string;
  label: string;
  icon: string;
  to: RouteLocationRaw;
  matches?: (routeName: string) => boolean;
}

interface RailAction {
  name: 'clone' | 'publish' | 'export' | 'delete';
  label: string;
  icon: string;
  color?: string;
}

const emit = defineEmits<{ action: [name: RailAction['name']] }>();

const route = useRoute();
const repoStore = useCurrentRepository();
const userTrackingStore = useUserTracking();

const activeUsers = computed(() =>
  userTrackingStore.getActiveUsers(
    'repository',
    repoStore.repositoryId as number,
  ),
);

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
      icon: 'cog-outline',
      to: { name: 'repository-settings', params: { id } },
      matches: (name) => name.startsWith('repository-settings'),
    });
  }

  return items;
});

const actions = computed<RailAction[]>(() => {
  if (!repoStore.repository?.hasAdminAccess) return [];
  return [
    { name: 'clone', label: 'Clone', icon: 'content-copy' },
    { name: 'publish', label: 'Publish', icon: 'upload' },
    { name: 'export', label: 'Export', icon: 'export' },
    { name: 'delete', label: 'Delete', icon: 'delete', color: 'error' },
  ];
});
</script>

<style lang="scss" scoped>
.navigation-rail {
  text-align: center;
  padding-top: 0.25rem;
}

.rail-tabs {
  padding: 0.5rem;

  :deep(.v-slide-group__container) {
    gap: 0.125rem;
  }

  .rail-tab {
    min-width: unset;
    justify-content: center;
    padding: 0.5rem 0.25rem;
    border-radius: 10px;
    font-size: 0.6875rem;
    letter-spacing: 0.02em;
    text-transform: none;
    color: rgba(255, 255, 255, 0.72);
    transition: background-color 160ms ease, color 160ms ease;

    :deep(.v-tab__slider) {
      display: none;
    }

    :deep(.v-btn__prepend) {
      margin-inline: 0;
      margin-bottom: 0.25rem;
    }
  }
}
</style>

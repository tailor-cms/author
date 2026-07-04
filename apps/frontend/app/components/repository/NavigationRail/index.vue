<template>
  <VNavigationDrawer
    width="74"
    class="navigation-rail"
    color="transparent"
    elevation="0"
    location="left"
    border="none"
    permanent
  >
    <VTabs
      class="rail-tabs"
      direction="vertical"
      height="60"
      hide-slider
      stacked
    >
      <VTab
        v-for="tab in repositoryTabs"
        :key="tab.key"
        :active="tab.matches?.(String(route.name ?? ''))"
        :prepend-icon="`mdi-${tab.icon}`"
        :ripple="false"
        :text="tab.label"
        :to="tab.to"
        class="rail-tab mb-1"
      />
    </VTabs>
    <template #append>
      <ActiveUsersGroup
        :users="activeUsers"
        :limit="4"
        :size="32"
        class="rail-active-users pa-2"
        vertical
      />
      <component
        :is="plugin.globalComponentName"
        v-for="plugin in globalPlugins"
        :key="plugin.id"
      />
      <VMenu v-if="actions.length" location="end" offset="8">
        <template #activator="{ props: menuProps }">
          <VBtn
            v-bind="menuProps"
            class="rail-menu-btn ma-2"
            icon="mdi-dots-horizontal"
            size="small"
            variant="tonal"
          />
        </template>
        <VList density="compact" min-width="200" nav>
          <VListSubheader>Repository actions</VListSubheader>
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
const { $pluginRegistry } = useNuxtApp() as any;
const globalPlugins = computed(() => $pluginRegistry.getGlobalComponents());

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

const selectedActivityQuery = computed(() => {
  const { params, query, name } = route;
  const id =
    name === 'editor'
      ? Number(params.activityId) || null
      : Number(query.activityId) || null;
  return id ? { activityId: String(id) } : undefined;
});

const repositoryTabs = computed<RailTab[]>(() => {
  const id = repoStore.repositoryId;
  if (!id) return [];

  const items: RailTab[] = [
    {
      key: 'structure',
      label: repoStore.isCollection ? 'Items' : 'Structure',
      icon: repoStore.isCollection ? 'view-list' : 'file-tree',
      to: {
        name: 'repository',
        params: { id },
        query: selectedActivityQuery.value,
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
      icon: 'chart-timeline-variant-shimmer',
      to: {
        name: 'progress',
        params: { id },
        query: selectedActivityQuery.value,
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
      icon: 'image-multiple',
      to: { name: 'repository-assets', params: { id } },
    },
    {
      key: 'search',
      label: 'Search',
      icon: 'folder-search',
      to: { name: 'search', params: { id } },
      matches: (name) => name === 'search',
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
    { name: 'publish', label: 'Publish', icon: 'cloud-upload-outline' },
    { name: 'export', label: 'Export', icon: 'archive-arrow-down-outline' },
    { name: 'delete', label: 'Delete', icon: 'trash-can-outline', color: 'error' },
  ];
});
</script>

<style lang="scss" scoped>
.navigation-rail {
  text-align: center;
}

.rail-tabs {
  :deep(.v-slide-group__container) {
    gap: 0.125rem;
  }

  .rail-tab {
    min-width: unset;
    justify-content: center;
    padding: 0;
    font-size: 0.6875rem;
    letter-spacing: 0.02em;
    text-transform: none;
    border-radius: 10px;
    transition: color 0.3s ease;

    :deep(.v-btn__overlay) {
      opacity: 0 !important;
    }

    :deep(.v-btn__prepend) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.125rem;
      height: 2.125rem;
      margin-inline: 0;
      border-radius: 8px;
      transition: background-color 0.3s ease, color 0.3s ease;

      .v-icon {
        padding: 1rem;
        transition: transform 0.3s ease;
      }
    }

    &.v-btn--active {
      color: rgba(var(--v-theme-on-surface), 1);
    }

    &:hover :deep(.v-btn__prepend) {
      background: rgba(var(--v-theme-on-surface-container-highest), 0.2);
      color: rgba(var(--v-theme-on-surface), 1);

      .v-icon {
        transform: scale(1.1);
      }
    }

    &.v-tab--selected,
    &.v-btn--active {
      :deep(.v-btn__prepend) {
        background: rgba(var(--v-theme-surface-container-highest), 1);
        color: rgba(var(--v-theme-on-surface), 1);

        .v-icon {
          transform: scale(1.1);
        }
      }
    }
  }
}
</style>

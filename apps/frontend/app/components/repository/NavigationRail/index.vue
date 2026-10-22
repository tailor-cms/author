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
        v-for="tab in railTabs"
        :key="tab.key"
        :active="tab.isActive"
        :ripple="false"
        :text="tab.label"
        :to="tab.to"
        class="rail-tab mb-1"
      >
        <template #prepend>
          <VBadge
            :color="tab.badgeColor ?? 'secondary'"
            :content="tab.badge"
            :model-value="!!tab.badge"
            offset-x="-2"
            offset-y="-2"
          >
            <span :class="{ 'is-active': tab.isActive }" class="rail-icon">
              <VIcon :icon="`mdi-${tab.icon}`" class="rail-icon-outline" />
              <VIcon :icon="`mdi-${tab.activeIcon}`" class="rail-icon-fill" />
            </span>
          </VBadge>
        </template>
      </VTab>
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
      <VMenu v-if="repositoryActions.length" location="end" offset="8">
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
            v-for="action in repositoryActions"
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
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { RepositoryAction } from '@/composables/useRepositoryActions';
import type { RouteLocationNamedRaw } from 'vue-router';

import { ActiveUsersGroup } from '@tailor-cms/core-components';
import { useCurrentRepository } from '@/stores/current-repository';
import { useMessagingStore } from '@/stores/messaging';
import { useUserTracking } from '@/stores/user-tracking';

interface RailTab {
  key: string;
  label: string;
  // Outlined at rest, filled when active
  icon: string;
  activeIcon: string;
  to: RouteLocationNamedRaw;
  matches?: (routeName: string) => boolean;
  badge?: string;
  badgeColor?: string;
}

const emit = defineEmits<{ action: [name: RepositoryAction['name']] }>();

const route = useRoute();
const repoStore = useCurrentRepository();
const userTrackingStore = useUserTracking();
const { $pluginRegistry } = useNuxtApp() as any;
const globalPlugins = computed(() => $pluginRegistry.getGlobalComponents());

const messagingStore = useMessagingStore();

const discussionBadge = computed(() => {
  const { mentions, threads } = messagingStore.unread;
  if (mentions) return { badge: String(mentions), badgeColor: 'secondary' };
  if (threads) return { badge: String(threads), badgeColor: 'primary' };
  return {};
});

const activeUsers = computed(() =>
  userTrackingStore.getActiveUsers(
    'repository',
    repoStore.repositoryId as number,
  ),
);

const lastEditorActivity = useLastEditorActivity();

const isOpenable = (activity?: Activity): activity is Activity =>
  !!activity && !activity.deletedAt;

const editorActivityId = computed(() => {
  const { repositoryId, outlineActivities, rootActivities } = repoStore;
  if (!repositoryId) return null;
  const savedId = lastEditorActivity.get(repositoryId);
  const saved = outlineActivities.find((it: any) => it.id === savedId);
  if (isOpenable(saved)) return saved.id;
  return rootActivities.find(isOpenable)?.id ?? null;
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
      icon: repoStore.isCollection ? 'view-list-outline' : 'file-tree-outline',
      activeIcon: repoStore.isCollection ? 'view-list' : 'file-tree',
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
      icon: 'text-box-edit-outline',
      activeIcon: 'text-box-edit',
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
      icon: 'clipboard-check-outline',
      activeIcon: 'clipboard-check',
      to: {
        name: 'progress',
        params: { id },
        query: selectedActivityQuery.value,
      },
    });
  }

  items.push({
    key: 'discussion',
    label: 'Threads',
    icon: 'forum-outline',
    activeIcon: 'forum',
    to: { name: 'discussion', params: { id } },
    ...discussionBadge.value,
  });

  items.push(
    {
      key: 'history',
      label: 'History',
      icon: 'clock-time-four-outline',
      activeIcon: 'clock-time-four',
      to: { name: 'revisions', params: { id } },
    },
    {
      key: 'assets',
      label: 'Assets',
      icon: 'image-multiple-outline',
      activeIcon: 'image-multiple',
      to: { name: 'repository-assets', params: { id } },
    },
  );

  if (!repoStore.isCollection && repoStore.activities.length) {
    items.push({
      key: 'search',
      label: 'Search',
      icon: 'folder-search-outline',
      activeIcon: 'folder-search',
      to: { name: 'search', params: { id } },
    });
  }

  if (repoStore.access.canAccessSettings) {
    items.push(
      {
        key: 'access',
        label: 'Access',
        icon: 'shield-account-outline',
        activeIcon: 'shield-account',
        to: { name: 'repository-access', params: { id } },
        matches: (name) => name.startsWith('repository-access'),
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: 'cog-outline',
        activeIcon: 'cog',
        to: { name: 'repository-settings', params: { id } },
      },
    );
  }

  return items;
});

const isTabActive = ({ matches, to }: RailTab) => {
  const name = String(route.name ?? '');
  return matches ? matches(name) : to.name === name;
};

const railTabs = computed(() =>
  repositoryTabs.value.map((tab) => ({ ...tab, isActive: isTabActive(tab) })),
);

const repositoryActions = useRepositoryActions(() => repoStore.accessPolicy);

watch(
  () => repoStore.repositoryId,
  (id) => id && messagingStore.fetchUnread(id),
  { immediate: true },
);
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

// Outline and fill stacked; activating fades the fill in as it grows
.rail-icon {
  display: grid;

  .v-icon {
    grid-area: 1 / 1;
    transition:
      transform 0.3s ease,
      opacity 0.2s ease,
      scale 0.3s cubic-bezier(0.2, 0, 0, 1);
  }

  .rail-icon-fill {
    opacity: 0;
    scale: 0.6;
  }

  &.is-active {
    .rail-icon-outline {
      opacity: 0;
    }

    .rail-icon-fill {
      opacity: 1;
      scale: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .v-icon {
      transition: none;
    }
  }
}
</style>

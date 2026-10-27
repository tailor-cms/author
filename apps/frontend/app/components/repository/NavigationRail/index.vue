<template>
  <NavigationRail :tabs="repositoryTabs">
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
  </NavigationRail>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import type { RepositoryAction } from '@/composables/useRepositoryActions';

import { ActiveUsersGroup } from '@tailor-cms/core-components';
import NavigationRail, {
  type RailTab,
} from '@/components/common/NavigationRail/index.vue';
import { useCurrentRepository } from '@/stores/current-repository';
import { useMessagingStore } from '@/stores/messaging';
import { useUserTracking } from '@/stores/user-tracking';

const emit = defineEmits<{ action: [name: RepositoryAction['name']] }>();

const route = useRoute();
const repoStore = useCurrentRepository();
const userTrackingStore = useUserTracking();
const { $pluginRegistry } = useNuxtApp() as any;
const globalPlugins = computed(() => $pluginRegistry.getGlobalComponents());

const messagingStore = useMessagingStore();

const discussionBadge = computed(() => {
  const { mentions, threads } = messagingStore.unread;
  if (mentions) return { badge: String(mentions), badgeColor: 'tertiary' };
  if (threads) return { badge: String(threads), badgeColor: 'secondary' };
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

const repositoryActions = useRepositoryActions(() => repoStore.accessPolicy);

watch(
  () => repoStore.repositoryId,
  (id) => id && messagingStore.fetchUnread(id),
  { immediate: true },
);
</script>

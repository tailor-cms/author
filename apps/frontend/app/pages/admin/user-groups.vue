<template>
  <VLayout class="group-management h-100">
    <VNavigationDrawer
      v-model="isListOpen"
      :class="{ resizing: isResizing }"
      :width="width"
      color="surface-canvas"
      location="left"
      mobile-breakpoint="md"
    >
      <div class="user-group-list-column h-100">
        <UserGroupList
          v-model:search="list.search.value"
          v-model:sort-order="list.sortOrder.value"
          :can-create="authStore.canCreateUserGroups"
          :has-actions="authStore.canModifyUserGroups"
          :has-more="list.hasMore.value"
          :is-loading="list.isLoading.value"
          :items="list.items.value"
          :selected-id="selectedId"
          @collapse="isListOpen = false"
          @create:group="openGroupDialog()"
          @delete:group="removeGroup"
          @edit:group="openGroupDialog"
          @load:more="list.loadMore"
          @select="selectGroup"
        />
        <div
          aria-orientation="vertical"
          class="resize-handle"
          role="separator"
          @pointerdown="startResize"
        />
      </div>
    </VNavigationDrawer>
    <VFadeTransition>
      <VBtn
        v-if="!isListOpen"
        v-tooltip:right="{ text: 'Open sidebar', openDelay: 500 }"
        aria-label="Open sidebar"
        class="sidebar-toggle"
        color="surface-overlay"
        density="comfortable"
        icon="mdi-format-list-bulleted"
        size="small"
        @click="isListOpen = true"
      />
    </VFadeTransition>
    <VMain scrollable>
      <VContainer class="px-md-10 py-md-8 text-left" max-width="1100">
        <NuxtPage />
      </VContainer>
    </VMain>
    <UserGroupDialog
      v-model:visible="isGroupDialogVisible"
      :group-data="editedGroup"
      :user-groups="list.items.value"
      @created="onCreated"
      @updated="list.refresh"
    />
  </VLayout>
</template>

<script lang="ts" setup>
import type { UserGroup } from '@tailor-cms/interfaces/user-group';
import { useDisplay } from 'vuetify';

import { api } from '@/api';
import UserGroupDialog from '@/components/admin/UserGroupDialog.vue';
import UserGroupList from '@/components/admin/UserGroupList/index.vue';
import { useAuthStore } from '@/stores/auth';

definePageMeta({ hasOwnLayout: true });

const route = useRoute();
const authStore = useAuthStore();
const { mdAndUp } = useDisplay();

const isGroupDialogVisible = ref(false);
const editedGroup = ref<UserGroup | null>(null);

const openGroupDialog = (group: UserGroup | null = null) => {
  editedGroup.value = group;
  isGroupDialogVisible.value = true;
};

const list = provideUserGroupList(() => openGroupDialog());

// Below md the list overlays the page, so it only starts open with no group
const isListOpen = ref(mdAndUp.value || !route.params.userGroupId);
const { width, isResizing, startResize } = useDrawerResize({
  side: 'left',
  storageKey: 'admin:user-groups:width',
  defaultWidth: 320,
  minWidth: 280,
  maxWidth: 560,
});

const selectedId = computed(() => Number(route.params.userGroupId) || null);

const selectGroup = (id: number) => {
  if (!mdAndUp.value) isListOpen.value = false;
  return navigateTo({ name: 'user-group', params: { userGroupId: id } });
};

const onCreated = async (group: UserGroup) => {
  await list.refresh();
  selectGroup(group.id);
};

const removeGroup = (group: UserGroup) => {
  const showDialog = useConfirmationDialog();
  showDialog({
    title: 'Delete user group',
    color: 'error',
    message: `Are you sure you want to delete "${group.name}" user group?`,
    action: async () => {
      await api.userGroup.delete({ params: { id: group.id } });
      await list.refresh();
      if (group.id !== selectedId.value) return;
      return navigateTo({ name: 'user-groups' });
    },
  });
};

onMounted(() => list.refresh());
</script>

<style lang="scss" scoped>
.group-management {
  // Suppress the drawer's width animation while dragging its handle
  .resizing {
    transition-duration: 0s !important;
  }
}

.user-group-list-column {
  position: relative;
  min-width: 0;
}

// Reopens the collapsed group list, like the Threads list toggle
.sidebar-toggle {
  position: absolute;
  // Above the scrollable VMain, which covers the whole layout
  z-index: 1;
  top: 6rem;
  left: 0;
  width: 1.5rem;
  height: 3.5rem;
  border-radius: 0 12px 12px 0;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  width: 0.3125rem;
  cursor: col-resize;
  touch-action: none;

  &:hover,
  &:active {
    background: rgba(var(--v-theme-primary), 0.25);
  }
}
</style>

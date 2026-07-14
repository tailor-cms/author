<template>
  <VNavigationDrawer
    width="74"
    class="workspace-rail"
    color="transparent"
    elevation="0"
    location="left"
    border="none"
    permanent
  >
    <div class="rail-tiles mt-2">
      <WorkspaceTile
        v-for="item in items"
        :key="item.id"
        :can-manage="some(authStore.groupsWithAdminAccess, { id: item.id })"
        :can-modify="authStore.isAdmin"
        :is-active="item.id === selectedId"
        :item="item"
        @delete="confirmDelete(item)"
        @edit="openEdit(item.id)"
        @select="selectedId = item.id"
      />
      <VAvatar
        v-if="authStore.isAdmin"
        v-tooltip:end="{ text: 'Create workspace', openDelay: 300 }"
        aria-label="Create workspace"
        class="rail-add mt-1"
        color="surface-container-high"
        role="button"
        rounded="xl"
        size="42"
        tabindex="0"
        @click="openCreate"
        @keydown.enter="openCreate"
        @keydown.space.prevent="openCreate"
      >
        <VIcon color="primary" icon="mdi-plus" size="22" />
      </VAvatar>
    </div>
    <UserGroupDialog
      v-model:visible="isDialogVisible"
      :group-data="editedWorkspace"
      :user-groups="authStore.userGroups"
      @created="emit('created', $event)"
      @updated="emit('updated', $event)"
    />
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import { api } from '@/api';
import UserGroupDialog from '@/components/admin/UserGroupDialog.vue';
import WorkspaceTile, { type WorkspaceOption } from './WorkspaceTile.vue';
import { useAuthStore } from '@/stores/auth';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { find, some } from 'lodash-es';

defineProps<{ items: WorkspaceOption[] }>();

const emit = defineEmits<{
  created: [group: UserGroup];
  updated: [group: UserGroup];
  deleted: [id: number];
}>();

const selectedId = defineModel<number | null>();

const authStore = useAuthStore();
const confirmationDialog = useConfirmationDialog();

const editedWorkspace = ref<UserGroup | null>(null);
const isDialogVisible = ref(false);

const openCreate = () => {
  editedWorkspace.value = null;
  isDialogVisible.value = true;
};

const openEdit = (id: number) => {
  editedWorkspace.value = find(authStore.userGroups, { id }) ?? null;
  isDialogVisible.value = true;
};

const confirmDelete = ({ id, name }: WorkspaceOption) =>
  confirmationDialog({
    title: 'Delete workspace',
    color: 'error',
    message:
      `Delete "${name}"? This removes all its members and unlinks its ` +
      `repositories, which may cut off members' access. This can't be undone.`,
    action: async () => {
      await api.userGroup.delete({ params: { id } });
      emit('deleted', id);
    },
  });
</script>

<style lang="scss" scoped>
.rail-tiles {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding-block: 0.25rem;
}

.rail-add {
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.05);
  }
}
</style>

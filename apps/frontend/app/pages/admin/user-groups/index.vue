<template>
  <div class="group-management">
    <div class="d-flex ga-3">
      <VTextField
        v-model="filter"
        bg-color="transparent"
        data-testid="search-user-groups"
        label="Search"
        max-width="300"
        prepend-inner-icon="mdi-magnify"
        rounded="pill"
        variant="solo-filled"
        clearable
        flat
        hide-details
      />
      <VSpacer />
      <VBtn
        v-if="authStore.isAdmin"
        aria-label="Add user group"
        color="primary"
        prepend-icon="mdi-account-multiple-plus"
        text="Add user group"
        variant="flat"
        @click.stop="showGroupDialog"
      />
    </div>
    <VDataTableServer
      :headers="headers"
      :items="userGroups"
      :items-length="totalItems"
      :items-per-page="dataTable.itemsPerPage"
      :items-per-page-options="[10, 25, 50, 100]"
      :loading="isLoading"
      :page="dataTable.page"
      :sort-by="dataTable.sortBy"
      no-data-text="No user groups."
      class="pt-4 bg-transparent"
      item-value="id"
      must-sort
      @update:options="fetch"
      @update:sort-by="($event) => (dataTable.sortBy = $event)"
    >
      <template #item="{ item }">
        <tr :key="item.id" class="group-entry">
          <td class="text-no-wrap text-left">
            <UserGroupAvatar :logo-url="item.logoUrl" size="32" />
            <NuxtLink
              :to="{ name: 'user-group', params: { userGroupId: item.id } }"
              class="ml-6"
            >
              {{ item.name }}
            </NuxtLink>
          </td>
          <td v-if="authStore.isAdmin" class="text-no-wrap text-left">
            <VBtn
              aria-label="Edit user group"
              class="mr-1"
              density="comfortable"
              icon="mdi-square-edit-outline"
              size="small"
              variant="text"
              @click="showGroupDialog(item)"
            />
            <VBtn
              aria-label="Delete user group"
              color="error"
              density="comfortable"
              icon="mdi-trash-can-outline"
              label="Delete user group"
              size="small"
              variant="text"
              @click="remove(item)"
            />
          </td>
        </tr>
      </template>
    </VDataTableServer>
    <UserGroupDialog
      :group-data="editedGroup"
      :user-groups="userGroups"
      :visible="isGroupDialogVisible"
      @created="fetch(defaultPage)"
      @update:visible="isGroupDialogVisible = $event"
      @updated="fetch(defaultPage)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import { api } from '@/api';
import UserGroupAvatar from '@/components/common/UserGroupAvatar.vue';
import UserGroupDialog from '@/components/admin/UserGroupDialog.vue';

definePageMeta({
  name: 'user-groups',
});

useHead({
  title: 'User group management',
});

const defaultPage = () => ({
  sortBy: [{ key: 'name', order: 'desc' }] as any,
  page: 1,
  itemsPerPage: 10,
});

const authStore = useAuthStore();

const headers: any = [
  { title: 'Group name', key: 'name', sortable: false },
  authStore.isAdmin && { title: 'Actions', key: 'actions', sortable: false },
].filter(Boolean);

const isLoading = ref(true);
const isGroupDialogVisible = ref(false);
const userGroups = ref<UserGroup[]>([]);
const totalItems = ref(0);
const dataTable = reactive(defaultPage());
const filter = ref('');
const editedGroup = ref<UserGroup | null>(null);

const showGroupDialog = (group: UserGroup | null = null) => {
  isGroupDialogVisible.value = true;
  editedGroup.value = group;
};

const fetch = async (opts = {}) => {
  Object.assign(dataTable, opts);
  isLoading.value = true;
  const { items, total } = await api.userGroup.list({
    query: {
      sortBy: dataTable.sortBy[0].key,
      sortOrder: dataTable.sortBy[0].order === 'desc' ? 'DESC' : 'ASC',
      offset: (dataTable.page - 1) * dataTable.itemsPerPage,
      limit: dataTable.itemsPerPage,
      filter: filter.value,
    },
  });
  userGroups.value = items;
  totalItems.value = total;
  isLoading.value = false;
};

const remove = (group: UserGroup) => {
  const showDialog = useConfirmationDialog();
  const confirmation = {
    title: 'Delete user group',
    color: 'error',
    message: `Are you sure you want to delete "${group.name}" user group?`,
    action: () =>
      api.userGroup
        .delete({ params: { id: group.id } })
        .then(() => fetch()),
  };
  showDialog(confirmation);
};

watch(filter, () => fetch());
</script>

<style lang="scss" scoped>
.filters {
  margin: 0 1.125rem 0.5rem;
}
</style>

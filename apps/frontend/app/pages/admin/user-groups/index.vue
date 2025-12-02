<template>
  <div class="group-management">
    <div class="d-flex py-6 px-4">
      <VSpacer />
      <VBtn
        v-if="authStore.isAdmin"
        aria-label="Add user group"
        class="px-3"
        color="primary-darken-2"
        variant="tonal"
        @click.stop="showGroupDialog"
      >
        <VIcon class="px-4">mdi-account-multiple-plus</VIcon>
        Add user group
      </VBtn>
    </div>
    <VRow class="filters justify-end">
      <VCol md="6">
        <VTextField
          v-model="filter"
          aria-label="Search user groups"
          label="Search"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
        />
      </VCol>
    </VRow>
    <VDataTable
      :headers="headers"
      :items="userGroups"
      :items-length="totalItems"
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
            <UserGroupAvatar :logo-url="item.logoUrl" />
            <NuxtLink
              :to="{ name: 'user-group', params: { userGroupId: item.id } }"
              class="ml-6 text-primary-darken-4"
            >
              {{ item.name }}
            </NuxtLink>
          </td>
          <td v-if="authStore.isAdmin" class="text-no-wrap text-left">
            <VBtn
              aria-label="Edit user group"
              color="primary-darken-4"
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="showGroupDialog(item)"
            />
            <VBtn
              aria-label="Delete user group"
              icon="mdi-delete-outline"
              label="Delete user group"
              color="primary-darken-4"
              size="small"
              variant="text"
              @click="remove(item)"
            />
          </td>
        </tr>
      </template>
    </VDataTable>
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

import { userGroup as api } from '@/api';
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
const editedGroup = ref(null);

const showGroupDialog = (group = null) => {
  isGroupDialogVisible.value = true;
  editedGroup.value = group;
};

const fetch = async (opts = {}) => {
  Object.assign(dataTable, opts);
  isLoading.value = true;
  const { items, total } = await api.fetch({
    sortBy: dataTable.sortBy[0].key,
    sortOrder: dataTable.sortBy[0].order === 'desc' ? 'DESC' : 'ASC',
    offset: (dataTable.page - 1) * dataTable.itemsPerPage,
    limit: dataTable.itemsPerPage,
    filter: filter.value,
  });
  userGroups.value = items;
  totalItems.value = total;
  isLoading.value = false;
};

const remove = (group: UserGroup) => {
  const showDialog = useConfirmationDialog();
  const confirmation = {
    title: 'Delete user group',
    message: `Are you sure you want to delete "${group.name}" user group?`,
    action: () => api.remove(group.id).then(() => fetch()),
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

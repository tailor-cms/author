<template>
  <div class="user-management">
    <div class="d-flex ga-3 mb-6 align-end">
      <VTextField
        v-model="filter"
        bg-color="transparent"
        data-testid="search-users"
        density="comfortable"
        label="Search"
        max-width="300"
        prepend-inner-icon="mdi-magnify"
        rounded="pill"
        variant="solo-filled"
        clearable
        flat
        hide-details
      />
      <VSwitch
        v-model="showArchiveToggle"
        label="Include Archived"
        hide-details
        density="comfortable"
      />
      <VSpacer />
      <VBtn
        prepend-icon="mdi-account-multiple-plus"
        color="primary"
        text="Add user"
        variant="flat"
        @click.stop="showUserDialog"
      />
    </div>
    <VDataTableServer
      :headers="headers"
      :items="users"
      :items-length="totalItems"
      :items-per-page="dataTable.itemsPerPage"
      :items-per-page-options="[10, 25, 50, 100]"
      :loading="isLoading"
      :page="dataTable.page"
      :sort-by="dataTable.sortBy"
      class="mt-4 rounded-xl"
      item-value="id"
      must-sort
      @update:options="fetch"
      @update:sort-by="($event) => (dataTable.sortBy = $event)"
    >
      <template #item="{ item }">
        <tr :key="item.id" class="user-entry">
          <td class="text-no-wrap text-left">
            <VAvatar :image="item?.imgUrl" size="36" variant="tonal" />
          </td>
          <td class="user-entry-email text-no-wrap text-left">
            {{ item.email }}
          </td>
          <td class="user-entry-first-name text-truncate text-left">
            {{ item.firstName || '/' }}
          </td>
          <td class="user-entry-last-name text-truncate text-left">
            {{ item.lastName || '/' }}
          </td>
          <td class="user-entry-role text-no-wrap text-left">
            {{ item.role }}
          </td>
          <td class="user-entry-created-at text-no-wrap text-left">
            {{ formatDate(item.createdAt, 'MM/dd/yy HH:mm') }}
          </td>
          <td class="user-entry-actions text-no-wrap text-center">
            <VBtn
              aria-label="Edit user"
              class="mr-1"
              density="comfortable"
              icon="mdi-square-edit-outline"
              size="small"
              variant="text"
              @click="showUserDialog(item)"
            />
            <VBtn
              :aria-label="item.deletedAt ? 'Restore user' : 'Archive user'"
              :disabled="currentUser?.id === item?.id"
              :icon="`mdi-account-${item.deletedAt ? 'convert' : 'off'}`"
              :label="item.deletedAt ? 'Restore user' : 'Archive user'"
              density="comfortable"
              size="small"
              variant="text"
              @click="archiveOrRestore(item)"
            />
          </td>
        </tr>
      </template>
    </VDataTableServer>
    <UserDialog
      :user-data="editedUser"
      :users="users"
      :user-groups="userGroups"
      :visible="isUserDialogVisible"
      @created="fetch(defaultPage)"
      @update:visible="isUserDialogVisible = $event"
      @updated="fetch(defaultPage)"
    />
  </div>
</template>

<script lang="ts" setup>
import type { User } from '@tailor-cms/interfaces/user';
import { formatDate } from 'date-fns/format';
import humanize from 'humanize-string';

import { api } from '@/api';
import { useAuthStore } from '@/stores/auth';
import UserDialog from '@/components/admin/UserDialog.vue';

definePageMeta({
  name: 'system-user-management',
});

useHead({
  title: 'Admin',
});

const authStore = useAuthStore();

const defaultPage = () => ({
  sortBy: [{ key: 'createdAt', order: 'desc' as const }],
  page: 1,
  itemsPerPage: 10,
});

const headers = [
  { title: 'User', sortable: false },
  { title: 'Email', value: 'email', sortable: true },
  { title: 'First Name', value: 'firstName', sortable: true },
  { title: 'Last Name', value: 'lastName', sortable: true },
  { title: 'Role', value: 'role', sortable: true },
  { title: 'Date Created', value: 'createdAt', sortable: true },
  { title: 'Actions', value: 'email', sortable: false },
];

const actions = {
  archive: (user: any) => api.user.delete({ params: { id: user.id } }),
  restore: (user: any) => api.user.upsert({ body: user }),
};

const isLoading = ref(true);
const users = ref<User[]>([]);
const userGroups = ref<any[]>([]);
const dataTable = reactive(defaultPage());
const totalItems = ref(0);
const filter = ref('');
const isUserDialogVisible = ref(false);
const editedUser = ref<User | null>(null);
const showArchiveToggle = ref(false);

const currentUser = computed(() => authStore.user);

const showUserDialog = (user: User | null = null) => {
  isUserDialogVisible.value = true;
  editedUser.value = user;
};

const fetch = async (opts = {}) => {
  Object.assign(dataTable, opts);
  isLoading.value = true;
  const { items, total } = await api.user.list({
    query: {
      sortBy: dataTable.sortBy[0]?.key,
      sortOrder: dataTable.sortBy[0]?.order === 'desc' ? 'DESC' : 'ASC',
      offset: (dataTable.page - 1) * dataTable.itemsPerPage,
      limit: dataTable.itemsPerPage,
      filter: filter.value,
      archived: showArchiveToggle.value || undefined,
    },
  });
  users.value = items;
  totalItems.value = total;
  isLoading.value = false;
};

const archiveOrRestore = (user: any) => {
  const action = user.deletedAt ? 'restore' : 'archive';
  const showDialog = useConfirmationDialog();
  const confirmation = {
    title: `${humanize(action)} user`,
    message: `Are you sure you want to ${action} user "${user.email}"?`,
    action: () => actions[action](user).then(() => fetch()),
  };
  showDialog(confirmation);
};

watch(filter, () => fetch());
watch(showArchiveToggle, () => fetch());

onBeforeMount(async () => {
  const { items } = await api.userGroup.list();
  userGroups.value = items;
});
</script>

<style lang="scss" scoped>
td.text-truncate {
  max-width: 7.25rem;
}
</style>

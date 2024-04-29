<template>
  <div>
    <div class="d-flex py-6 px-4">
      <VSpacer />
      <VBtn
        class="px-3"
        color="primary-darken-3"
        variant="tonal"
        @click.stop="showUserDialog"
      >
        <VIcon class="px-4">mdi-account-multiple-plus</VIcon>
        Add user
      </VBtn>
    </div>
    <VRow class="filters">
      <VCol>
        <VSwitch
          v-model="showArchived"
          color="primary-darken-3"
          label="Archived"
          hide-details
        />
      </VCol>
      <VCol>
        <VTextField
          v-model="filter"
          label="Search"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
        />
      </VCol>
    </VRow>
    <VDataTableServer
      :headers="headers"
      :items="users"
      :items-length="totalItems"
      :items-per-page="dataTable.itemsPerPage"
      :items-per-page-options="[10, 25, 50, 100]"
      :loading="isLoading"
      :page="dataTable.page"
      :sort-by="dataTable.sortBy"
      class="pt-4"
      item-value="id"
      must-sort
      @update:options="fetch"
      @update:sort-by="($event) => (dataTable.sortBy = $event)"
    >
      <template #item="{ item }">
        <tr :key="item.id">
          <td class="text-no-wrap text-left">
            <VAvatar :image="item?.imgUrl" size="40" variant="tonal" />
          </td>
          <td class="text-no-wrap text-left">{{ item.email }}</td>
          <td class="text-truncate text-left">{{ item.firstName || '/' }}</td>
          <td class="text-truncate text-left">{{ item.lastName || '/' }}</td>
          <td class="text-no-wrap text-left">{{ item.role }}</td>
          <td class="text-no-wrap text-left">
            {{ formatDate(item.createdAt, 'MM/dd/yy HH:mm') }}
          </td>
          <td class="text-no-wrap text-center">
            <VBtn
              color="primary-darken-4"
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="showUserDialog(item)"
            />
            <VBtn
              :disabled="currentUser?.id === item?.id"
              :icon="`mdi-account-${item.deletedAt ? 'convert' : 'off'}`"
              color="primary-darken-4"
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
      :visible="isUserDialogVisible"
      @created="fetch(defaultPage)"
      @update:visible="isUserDialogVisible = $event"
      @updated="fetch(defaultPage)"
    />
  </div>
</template>

<script lang="ts" setup>
import formatDate from 'date-fns/format';
import humanize from 'humanize-string';

import { user as api } from '@/api';
import { useAuthStore } from '@/stores/auth';
import UserDialog from '@/components/admin/UserDialog.vue';

definePageMeta({
  name: 'system-user-management',
});

const authStore = useAuthStore();

const defaultPage = () => ({
  sortBy: [{ key: 'createdAt', order: 'desc' }],
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
  archive: (user: any) => api.remove(user),
  restore: (user: any) => api.upsert(user),
};

const isLoading = ref(true);
const users = ref([]);
const filter = ref('');
const dataTable = reactive(defaultPage());
const totalItems = ref(0);
const isUserDialogVisible = ref(false);
const editedUser = ref(null);
const showArchived = ref(false);

const currentUser = computed(() => authStore.user);

const showUserDialog = (user = null) => {
  isUserDialogVisible.value = true;
  editedUser.value = user;
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
    archived: showArchived.value || undefined,
  });
  users.value = items;
  totalItems.value = total;
  isLoading.value = false;
};

const archiveOrRestore = (user: any) => {
  const action = user.deletedAt ? 'restore' : 'archive';
  const dialog = useConfirmationDialog();
  const confirmation = {
    title: `${humanize(action)} user`,
    message: `Are you sure you want to ${action} user "${user.email}"?`,
    action: () => actions[action](user).then(() => fetch()),
  };
  dialog(confirmation);
};

watch(filter, () => fetch());
watch(showArchived, () => fetch());
</script>

<style lang="scss" scoped>
.filters {
  margin: 0 1.125rem 0.5rem;
}

td.text-truncate {
  max-width: 7.25rem;
}
</style>

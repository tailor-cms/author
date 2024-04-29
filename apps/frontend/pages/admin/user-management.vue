<template>
  <div>
    <div class="d-flex py-6 px-4">
      <VSpacer />
      <VBtn
        @click.stop="showUserDialog"
        class="px-3"
        color="primary-darken-3"
        variant="tonal"
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
          prepend-inner-icon="mdi-magnify"
          label="Search"
          variant="outlined"
          clearable
          hide-details
        />
      </VCol>
    </VRow>
    <VDataTable
      v-if="!isLoading"
      v-show="!!totalItems"
      :footer-props="{ itemsPerPageOptions: [10, 20, 50, 100] }"
      :headers="headers"
      :items="users"
      :must-sort="true"
      :options="dataTable"
      :server-items-length="totalItems"
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
            {{ item.createdAt }}
          </td>
          <td class="text-no-wrap text-center">
            <VBtn
              @click="showUserDialog(item)"
              color="primary-darken-4"
              icon="mdi-pencil"
              size="small"
              variant="text"
            />
            <VBtn
              @click="archiveOrRestore(item)"
              :disabled="currentUser?.id === item?.id"
              :icon="`mdi-account-${item.deletedAt ? 'convert' : 'off'}`"
              color="primary-darken-4"
              size="small"
              variant="text"
            />
          </td>
        </tr>
      </template>
    </VDataTable>
    <VProgressCircular
      v-else
      indeterminate
      class="my-14"
      color="primary-darken-3"
      size="44"
    />
    <UserDialog
      @updated="fetch(defaultPage)"
      @created="fetch(defaultPage)"
      @update:visible="isUserDialogVisible = $event"
      :visible="isUserDialogVisible"
      :user-data="editedUser"
      :users="users"
    />
  </div>
</template>

<script lang="ts" setup>
import { user as api } from '@/api';
import humanize from 'humanize-string';
import throttle from 'lodash/throttle';
import UserDialog from '@/components/admin/UserDialog.vue';
import { useAuthStore } from '@/stores/auth';

definePageMeta({
  name: 'system-user-management',
});

const authStore = useAuthStore();

const defaultPage = () => ({
  sortBy: ['updatedAt'],
  sortDesc: [true],
  page: 1,
  itemsPerPage: 10,
});

const headers = [
  { text: 'User', sortable: false },
  { text: 'Email', value: 'email' },
  { text: 'First Name', value: 'firstName' },
  { text: 'Last Name', value: 'lastName' },
  { text: 'Role', value: 'role' },
  { text: 'Date Created', value: 'createdAt' },
  { text: 'Actions', value: 'email', sortable: false },
];

const actions = {
  archive: (user: any) => api.remove(user),
  restore: (user: any) => api.upsert(user),
};

const isLoading = ref(true);
const users = ref([]);
const filter = ref('');
const dataTable = ref(defaultPage());
const totalItems = ref(0);
const isUserDialogVisible = ref(false);
const editedUser = ref(null);
const showArchived = ref(false);

const currentUser = computed(() => authStore.user);

const showUserDialog = (user = null) => {
  isUserDialogVisible.value = true;
  editedUser.value = user;
};

const fetch = throttle(async (opts = {}) => {
  isLoading.value = true;
  Object.assign(dataTable.value, opts);
  const { items, total } = await api.fetch({
    sortBy: dataTable.value.sortBy[0],
    sortOrder: dataTable.value.sortDesc[0] ? 'DESC' : 'ASC',
    offset: (dataTable.value.page - 1) * dataTable.value.itemsPerPage,
    limit: dataTable.value.itemsPerPage,
    filter: filter.value,
    archived: showArchived.value || undefined,
  });
  console.log(items);
  users.value = items;
  totalItems.value = total;
  isLoading.value = false;
}, 400);

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

watch(dataTable, () => fetch());
watch(filter, () => fetch());
watch(showArchived, () => fetch());

onBeforeMount(() => fetch());
</script>

<style lang="scss" scoped>
.filters {
  margin: 0 1.125rem 0.5rem;
}

td.text-truncate {
  max-width: 7.25rem;
}
</style>

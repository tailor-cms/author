<template>
  <div class="user-management">
    <div class="d-flex align-center ga-4 mb-4">
      <VTextField
        v-model="filter"
        bg-color="transparent"
        class="user-search"
        data-testid="search-users"
        density="comfortable"
        max-width="300"
        placeholder="Search users..."
        prepend-inner-icon="mdi-magnify"
        rounded="xl"
        variant="solo-filled"
        clearable
        flat
        hide-details
      />
      <VSwitch
        v-model="showArchiveToggle"
        class="flex-grow-0"
        density="comfortable"
        label="Include archived"
        hide-details
      />
      <VSpacer />
      <VBtn
        color="primary"
        prepend-icon="mdi-plus"
        text="Add user"
        variant="flat"
        @click="showUserDialog()"
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
      :row-props="rowProps"
      :sort-by="dataTable.sortBy"
      class="bg-surface-raised rounded-lg text-left elevation-1"
      item-value="id"
      must-sort
      @update:options="fetch"
      @update:sort-by="($event) => (dataTable.sortBy = $event)"
    >
      <template #[`item.avatar`]="{ item }">
        <VAvatar :image="item?.imgUrl" size="32" variant="tonal" />
      </template>
      <template #[`item.email`]="{ item }">
        <div class="d-flex align-center ga-2 text-no-wrap">
          {{ item.email }}
          <VChip
            v-if="item.deletedAt"
            density="comfortable"
            size="small"
            text="Archived"
            variant="tonal"
          />
        </div>
      </template>
      <template #[`item.firstName`]="{ item }">
        <span :class="{ 'text-medium-emphasis': !item.firstName }">
          {{ item.firstName || '—' }}
        </span>
      </template>
      <template #[`item.lastName`]="{ item }">
        <span :class="{ 'text-medium-emphasis': !item.lastName }">
          {{ item.lastName || '—' }}
        </span>
      </template>
      <template #[`item.role`]="{ item }">
        {{ item.role }}
      </template>
      <template #[`item.createdAt`]="{ item }">
        <span class="text-no-wrap">
          {{ formatDate(item.createdAt, 'MM/dd/yy HH:mm') }}
        </span>
      </template>
      <template #[`item.actions`]="{ item }">
        <span class="text-no-wrap">
          <VBtn
            v-tooltip:bottom="{ text: 'Edit user', openDelay: 500 }"
            aria-label="Edit user"
            class="mr-1"
            density="comfortable"
            icon="mdi-square-edit-outline"
            size="small"
            variant="text"
            @click="showUserDialog(item)"
          />
          <VBtn
            v-tooltip:bottom="{
              text: item.deletedAt ? 'Restore user' : 'Archive user',
              openDelay: 500,
            }"
            :aria-label="item.deletedAt ? 'Restore user' : 'Archive user'"
            :disabled="currentUser?.id === item?.id"
            :icon="`mdi-account-${item.deletedAt ? 'convert' : 'off'}`"
            color="error"
            density="comfortable"
            size="small"
            variant="text"
            @click="archiveOrRestore(item)"
          />
        </span>
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
  { title: 'User', value: 'avatar', sortable: false },
  { title: 'Email', value: 'email', sortable: true },
  { title: 'First name', value: 'firstName', sortable: true },
  { title: 'Last name', value: 'lastName', sortable: true },
  { title: 'Role', value: 'role', sortable: true },
  { title: 'Date created', value: 'createdAt', sortable: true },
  {
    value: 'actions',
    sortable: false,
    align: 'end' as const,
  },
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

const rowProps = ({ item }: { item: User }) => ({
  class: ['user-entry', item.deletedAt && 'user-entry--archived'],
});

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
    color: 'error',
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
:deep(tbody) tr.user-entry--archived td:not(:last-child) {
  opacity: 0.6;
}
</style>

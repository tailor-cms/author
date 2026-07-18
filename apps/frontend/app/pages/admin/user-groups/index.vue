<template>
  <div class="group-management">
    <div class="d-flex align-center ga-4 mb-4">
      <VTextField
        v-model="filter"
        bg-color="transparent"
        class="group-search"
        data-testid="search-user-groups"
        density="comfortable"
        max-width="300"
        placeholder="Search user groups..."
        prepend-inner-icon="mdi-magnify"
        rounded="xl"
        variant="solo-filled"
        clearable
        flat
        hide-details
      />
      <VBtn
        v-tooltip:top="{
          text: sortOrder === 'desc' ? 'Name (Z–A)' : 'Name (A–Z)',
          openDelay: 500,
        }"
        :icon="sortIcon"
        aria-label="Toggle sort order"
        class="text-medium-emphasis"
        size="small"
        variant="text"
        @click="toggleSort"
      />
      <VSpacer />
      <VBtn
        v-if="authStore.canCreateUserGroups"
        aria-label="Add user group"
        color="primary"
        prepend-icon="mdi-plus"
        text="Add user group"
        variant="flat"
        @click="showGroupDialog()"
      />
    </div>
    <TailorEmptyState
      v-if="!isLoading && !userGroups.length"
      :icon="filter ? 'mdi-magnify' : 'mdi-account-group-outline'"
      :text="
        filter
          ? 'No user groups match your search.'
          : 'Create a user group to get started.'
      "
      :title="filter ? 'No matches' : 'No user groups'"
    />
    <template v-else-if="!isLoading">
      <VRow class="group-grid" dense>
        <VCol
          v-for="group in userGroups"
          :key="group.id"
          cols="12"
          md="4"
          sm="6"
          xl="3"
        >
          <UserGroupCard
            :group="group"
            :has-actions="authStore.canModifyUserGroups"
            @edit:group="showGroupDialog"
            @delete:group="remove"
          />
        </VCol>
      </VRow>
      <div
        v-if="totalItems"
        class="d-flex align-center justify-space-between mt-2 px-1"
      >
        <span class="text-body-medium">
          Showing {{ pageStart }}–{{ pageEnd }} of {{ totalItems }}
        </span>
        <VPagination
          v-if="pageCount > 1"
          :length="pageCount"
          :model-value="dataTable.page"
          :total-visible="7"
          density="comfortable"
          rounded
          @update:model-value="(page) => fetch({ page })"
        />
      </div>
    </template>
    <UserGroupDialog
      v-model:visible="isGroupDialogVisible"
      :group-data="editedGroup"
      :user-groups="userGroups"
      @created="fetch(defaultPage())"
      @updated="fetch(defaultPage())"
    />
  </div>
</template>

<script lang="ts" setup>
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import { TailorEmptyState } from '@tailor-cms/core-components';

import { api } from '@/api';
import UserGroupCard from '@/components/admin/UserGroupCard/index.vue';
import type { UserGroupRow } from '@/components/admin/UserGroupCard/types';
import UserGroupDialog from '@/components/admin/UserGroupDialog.vue';

definePageMeta({ name: 'user-groups' });
useHead({ title: 'User group management' });

const defaultPage = () => ({
  sortBy: [{ key: 'name', order: 'asc' as 'asc' | 'desc' }],
  page: 1,
  itemsPerPage: 24,
});

const authStore = useAuthStore();

const isLoading = ref(true);
const isGroupDialogVisible = ref(false);
const userGroups = ref<UserGroupRow[]>([]);
const totalItems = ref(0);
const dataTable = reactive(defaultPage());
const filter = ref('');
const editedGroup = ref<UserGroup | null>(null);

const pageCount = computed(() =>
  Math.ceil(totalItems.value / dataTable.itemsPerPage),
);
const pageStart = computed(
  () => (dataTable.page - 1) * dataTable.itemsPerPage + 1,
);
const pageEnd = computed(() =>
  Math.min(dataTable.page * dataTable.itemsPerPage, totalItems.value),
);

const sortOrder = computed(() => dataTable.sortBy[0]?.order ?? 'asc');
const sortIcon = computed(() => sortOrder.value === 'desc'
  ? 'mdi-sort-alphabetical-descending'
  : 'mdi-sort-alphabetical-ascending',
);

const toggleSort = () => {
  const order = sortOrder.value === 'asc' ? 'desc' : 'asc';
  fetch({ sortBy: [{ key: 'name', order }], page: 1 });
};

const showGroupDialog = (group: UserGroup | null = null) => {
  isGroupDialogVisible.value = true;
  editedGroup.value = group;
};

const fetch = async (opts = {}) => {
  Object.assign(dataTable, opts);
  isLoading.value = true;
  const { items, total } = await api.userGroup.list({
    query: {
      sortBy: dataTable.sortBy[0]?.key,
      sortOrder: dataTable.sortBy[0]?.order === 'desc' ? 'DESC' : 'ASC',
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

watch(filter, () => fetch(defaultPage()));

onMounted(() => fetch());
</script>

<style lang="scss" scoped>
.group-search :deep(.v-field__outline) {
  display: none;
}
</style>

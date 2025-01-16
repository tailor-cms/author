<template>
  <div>
    <div class="d-flex py-6 px-4">
      <VSpacer />
      <VBtn
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
    <VDataTableServer
      :headers="headers"
      :items="userGroups"
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
            {{ item.name }}
          </td>
          <td class="text-no-wrap text-left">
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
import { userGroup as api } from '@/api';
import UserGroupDialog from '@/components/admin/UserGroupDialog.vue';

definePageMeta({
  name: 'user-groups',
});

useHead({
  title: 'User group management',
});

const defaultPage = () => ({
  sortBy: [{ key: 'name', order: 'desc' }],
  page: 1,
  itemsPerPage: 10,
});

const headers = [
  { title: 'Name', sortable: false },
  { title: 'Actions', sortable: false },
];

const isLoading = ref(true);
const userGroups = ref<any[]>([]);
const dataTable = reactive(defaultPage());
const totalItems = ref(0);
const filter = ref('');
const isGroupDialogVisible = ref(false);
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

const remove = (group: any) => {
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

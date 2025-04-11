<template>
  <VAlert
    v-if="groups.length === 0"
    class="mt-12 ml-10 mr-5"
    color="primary-darken-2"
    variant="tonal"
    icon="mdi-information-outline"
  >
    No associated user groups.
  </VAlert>
  <VDataTable
    v-else
    :headers="headers"
    :items="groups"
    :items-per-page="-1"
    class="pt-5 px-6 bg-transparent"
    no-data-text="No associated user groups."
  >
    <template #item="{ item }">
      <tr :key="item.id">
        <td class="text-truncate text-left">
          <UserGroupAvatar :logo-url="item.logoUrl" />
          <NuxtLink
            :to="{ name: 'user-group', params: { userGroupId: item.id } }"
            class="ml-5 text-primary-darken-4"
          >
            {{ item.name }}
          </NuxtLink>
        </td>
        <td class="text-left">
          <VBtn
            aria-label="Deassociate user group"
            icon="mdi-delete-outline"
            label="Deassociate user group"
            color="primary-darken-4"
            size="small"
            variant="text"
            @click="remove(item)"
          />
        </td>
      </tr>
    </template>
  </VDataTable>
</template>

<script lang="ts" setup>
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import api from '@/api/repository.js';
import UserGroupAvatar from '@/components/common/UserGroupAvatar.vue';

const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();

const headers: any = [
  { title: 'Group name', key: 'name', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
];

const groups = computed(
  () => currentRepositoryStore?.repository?.userGroups || [],
);

const remove = (group: UserGroup) => {
  const showDialog = useConfirmationDialog();
  const { repositoryId } = currentRepositoryStore;
  const payload = {
    repositoryId,
    userGroupId: group.id,
  };
  const confirmation = {
    title: 'Remove from user group?',
    message: `Are you sure you want to remove "${group.name}" user group?`,
    action: () =>
      api
        .removeUserGroup(payload)
        .then(() => repositoryStore.get(repositoryId as number)),
  };
  showDialog(confirmation);
};
</script>

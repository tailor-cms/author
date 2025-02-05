<template>
  <VDataTable
    :items="groups"
    :items-per-page="-1"
    class="pt-4 px-6 bg-transparent"
    hide-default-header
    hide-default-footer
  >
    <template #item="{ item }">
      <tr :key="item.id">
        <td class="text-truncate text-left">
          <NuxtLink
            :to="{ name: 'user-group', params: { userGroupId: item.id } }"
            class="text-primary-darken-4"
          >
            {{ item.name }}
          </NuxtLink>
        </td>
        <td>
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
import api from '@/api/repository.js';

const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();

const groups = computed(
  () => currentRepositoryStore?.repository?.userGroups || [],
);

const remove = (group: any) => {
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

<template>
  <VAlert
    v-if="!allGroups.length"
    icon="mdi-information-outline"
    text="No associated user groups."
    variant="tonal"
  />
  <VDataIterator
    v-else
    v-model:page="page"
    :items="groups"
    :items-per-page="ITEMS_PER_PAGE"
  >
    <template #default="{ items }">
      <VList class="group-list pa-0" bg-color="transparent">
        <VListItem
          v-for="{ raw: group } in items"
          :key="group.id"
          :to="{ name: 'user-group', params: { userGroupId: group.id } }"
          :title="group.name"
          class="group-row bg-surface-container py-3 px-4 mb-2"
          rounded="lg"
        >
          <template #prepend>
            <UserGroupAvatar :logo-url="group.logoUrl" size="small" />
          </template>
          <template #append>
            <VBtn
              aria-label="Deassociate user group"
              color="error"
              density="comfortable"
              icon="mdi-trash-can-outline"
              size="small"
              variant="tonal"
              @click.stop.prevent="remove(group)"
            />
          </template>
        </VListItem>
      </VList>
    </template>
    <template #no-data>
      <VAlert
        icon="mdi-magnify"
        variant="tonal"
        text="No users match your search"
      />
    </template>
    <template #footer="{ page: currentPage, pageCount, itemsCount }">
      <div
        v-if="itemsCount"
        class="list-footer d-flex align-center justify-space-between mt-2 px-1"
      >
        <span class="text-body-medium">
          Showing {{ (currentPage - 1) * ITEMS_PER_PAGE + 1 }}–{{
            Math.min(currentPage * ITEMS_PER_PAGE, itemsCount)
          }} of {{ itemsCount }}
        </span>
        <VPagination
          v-if="pageCount > 1"
          v-model="page"
          :length="pageCount"
          :total-visible="7"
          density="comfortable"
          rounded
        />
      </div>
    </template>
  </VDataIterator>
</template>

<script lang="ts" setup>
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import { api } from '@/api';
import UserGroupAvatar from '@/components/common/UserGroupAvatar.vue';

const props = defineProps<{
  groups: UserGroup[];
}>();

const ITEMS_PER_PAGE = 10;

const repositoryStore = useRepositoryStore();
const currentRepositoryStore = useCurrentRepository();

const allGroups = computed(
  () => currentRepositoryStore?.repository?.userGroups || [],
);

const page = ref(1);

const groups = computed(() => props.groups);

const remove = (group: UserGroup) => {
  const showDialog = useConfirmationDialog();
  const { repositoryId } = currentRepositoryStore;
  const confirmation = {
    title: 'Remove from user group?',
    color: 'error',
    message: `Are you sure you want to remove "${group.name}" user group?`,
    action: () =>
      api.repository
        .removeUserGroup({
          params: {
            repositoryId: repositoryId as number,
            userGroupId: group.id,
          },
        })
        .then(() => repositoryStore.get(repositoryId as number)),
  };
  showDialog(confirmation);
};
</script>

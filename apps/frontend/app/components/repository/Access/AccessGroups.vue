<template>
  <section class="access-groups">
    <VDataIterator
      v-model:page="page"
      :items="groups"
      :items-per-page="ITEMS_PER_PAGE"
      :search="search"
      :filter-keys="FILTER_KEYS"
      :sort-by="[{ key: 'name', order: sortOrder }]"
    >
      <template #default="{ items }">
        <VList
          bg-color="transparent"
          class="group-list pa-0 overflow-visible"
        >
          <VListItem
            v-for="{ raw: group } in items"
            :key="group.id"
            :title="group.name"
            class="group-row bg-surface-raised py-4 px-4 mb-2"
            elevation="1"
            rounded="lg"
          >
            <template #prepend>
              <UserGroupAvatar :logo-url="group.logoUrl" size="small" />
            </template>
            <template #append>
              <VBtn
                :to="{ name: 'user-group', params: { userGroupId: group.id } }"
                append-icon="mdi-arrow-right"
                aria-label="View user group"
                class="mr-2"
                size="small"
                text="View group"
                variant="tonal"
              />
              <VBtn
                aria-label="Deassociate user group"
                color="error"
                density="comfortable"
                icon="mdi-trash-can-outline"
                size="small"
                variant="tonal"
                @click="remove(group)"
              />
            </template>
          </VListItem>
        </VList>
      </template>
      <template #no-data>
        <TailorEmptyState
          v-bind="emptyState"
          @click:action="emit('clear:search')"
        />
      </template>
      <template #footer="{ page: currentPage, pageCount, itemsCount }">
        <div
          v-if="itemsCount"
          class="d-flex align-center justify-space-between mt-2 px-1"
        >
          <span class="text-body-medium">
            Showing {{ (currentPage - 1) * ITEMS_PER_PAGE + 1 }}
            –{{ Math.min(currentPage * ITEMS_PER_PAGE, itemsCount) }}
            of {{ itemsCount }}
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
  </section>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import type { UserGroup } from '@tailor-cms/interfaces/user-group';
import { TailorEmptyState } from '@tailor-cms/core-components';

import { api } from '@/api';
import UserGroupAvatar from '@/components/common/UserGroupAvatar.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  search: string;
  sortOrder: 'asc' | 'desc';
}>();

const emit = defineEmits<{ 'clear:search': [] }>();

const ITEMS_PER_PAGE = 10;
const FILTER_KEYS = ['name'];

const store = useCurrentRepository();
const repositoryStore = useRepositoryStore();
const { repository } = storeToRefs(store);

const page = ref(1);

const groups = computed<UserGroup[]>(
  () => (repository.value?.userGroups as UserGroup[]) ?? [],
);

const emptyState = computed(() => props.search
  ? {
      actionText: 'Clear search',
      prependActionIcon: 'mdi-close',
      icon: 'mdi-magnify',
      text: 'No user groups match your search.',
      title: 'No matches',
    }
  : {
      icon: 'mdi-account-group-outline',
      text: 'No user groups associated with this repository yet.',
      title: 'No user groups',
    },
);

watch(
  () => [props.search, props.sortOrder],
  () => {
    page.value = 1;
  },
);

const remove = (group: UserGroup) => {
  const showDialog = useConfirmationDialog();
  const { repositoryId } = store;
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

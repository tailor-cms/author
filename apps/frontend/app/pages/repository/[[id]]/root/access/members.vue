<template>
  <section class="access-members">
    <template v-if="!isLoading">
      <VDataIterator
        v-model:page="page"
        :items="users"
        :items-per-page="ITEMS_PER_PAGE"
        :search="search"
        :filter-keys="FILTER_KEYS"
        :sort-by="[{ key: 'label', order: sortOrder }]"
      >
        <template #default="{ items }">
          <VList
            bg-color="transparent"
            class="member-list pa-0 overflow-visible"
          >
            <MemberRow
              v-for="{ raw: user } in items"
              :key="user.id"
              :img-url="user.imgUrl"
              :role="user.repositoryRole"
              :roles="roles"
              :subtitle="user.fullName ? user.email : ''"
              :title="user.label"
              @update:role="upsertUser(user.email, $event as RepositoryRole)"
              @remove:member="remove(user)"
            />
          </VList>
        </template>
        <template #no-data>
          <TailorEmptyState
            v-bind="emptyState"
            @click:action="emit('clear:search')"
          />
        </template>
        <template #footer="{ pageCount, itemsCount }">
          <PaginationFooter
            v-model:page="page"
            :page-count="pageCount"
            :items-count="itemsCount"
            :items-per-page="ITEMS_PER_PAGE"
          />
        </template>
      </VDataIterator>
    </template>
  </section>
</template>

<script lang="ts" setup>
import type { RepositoryRole } from '@tailor-cms/interfaces/role';
import { storeToRefs } from 'pinia';
import { TailorEmptyState } from '@tailor-cms/core-components';

import MemberRow from '@/components/common/MemberRow.vue';
import PaginationFooter from '@/components/common/PaginationFooter.vue';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  name: 'repository-access-members',
});

const props = defineProps<{
  search: string;
  sortOrder: 'asc' | 'desc';
}>();

const emit = defineEmits<{ 'clear:search': [] }>();

const ITEMS_PER_PAGE = 10;
const FILTER_KEYS = ['label', 'email'];

const store = useCurrentRepository();
const notify = useNotification();
const { users } = storeToRefs(store);

const roles = useRepositoryRoles();

const isLoading = ref(true);
const page = ref(1);

const emptyState = computed(() => props.search
  ? {
      actionText: 'Clear search',
      prependActionIcon: 'mdi-close',
      icon: 'mdi-magnify',
      text: 'No members match your search.',
      title: 'No matches',
    }
  : {
      icon: 'mdi-account-multiple-outline',
      text: 'No users assigned to this repository yet.',
      title: 'No members',
    },
);

watch(
  () => [props.search, props.sortOrder],
  () => {
    page.value = 1;
  },
);

const upsertUser = async (email: string, newRole: RepositoryRole) => {
  await store.upsertUser(email, newRole);
  await notify('User updated');
};

const removeUser = async (userId: number) => {
  await store.removeUser(userId);
};

const remove = (user: { id: number; email: string }) => {
  const showConfirmationModal = useConfirmationDialog();
  showConfirmationModal({
    title: 'Remove user',
    color: 'error',
    message: `Are you sure you want to remove user "${user.email}" \
from this repository?`,
    action: () => removeUser(user.id),
  });
};

onMounted(async () => {
  await store.getUsers();
  isLoading.value = false;
});
</script>

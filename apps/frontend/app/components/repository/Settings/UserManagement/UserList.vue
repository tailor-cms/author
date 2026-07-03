<template>
  <VAlert
    v-if="!isLoading && !store.users.length"
    icon="mdi-information-outline"
    text="No assigned users."
    variant="tonal"
  />
  <VDataIterator
    v-else-if="!isLoading"
    v-model:page="page"
    :items="users"
    :items-per-page="ITEMS_PER_PAGE"
  >
    <template #default="{ items }">
      <VList class="user-list pa-0 overflow-visible" bg-color="transparent">
        <VListItem
          v-for="{ raw: user } in (items as unknown as { raw: RepositoryUser }[])"
          :key="user.id"
          :subtitle="user.fullName ? user.email : ''"
          :title="user.label || user.email"
          class="user-row bg-surface-raised py-3 px-4 mb-2"
          elevation="1"
          rounded="lg"
        >
          <template #prepend>
            <VAvatar :image="user.imgUrl" size="34" variant="tonal" />
          </template>
          <template #append>
            <VMenu location="bottom end">
              <template #activator="{ props: menuProps }">
                <VBtn
                  v-bind="menuProps"
                  :text="roleLabel(user.repositoryRole)"
                  append-icon="mdi-chevron-down"
                  class="user-role-btn mr-2"
                  rounded="pill"
                  size="small"
                  variant="tonal"
                />
              </template>
              <VList max-width="360" min-width="240" slim>
                <VListSubheader>Choose role</VListSubheader>
                <VListItem
                  v-for="role in roles"
                  :key="role.value"
                  :active="user.repositoryRole === role.value"
                  :prepend-icon="roleIcon(user.repositoryRole, role.value)"
                  :subtitle="role.description"
                  :title="role.title"
                  class="role-option"
                  lines="two"
                  @click="upsertUser(user.email, role.value)"
                />
              </VList>
            </VMenu>
            <VBtn
              aria-label="Remove user"
              color="error"
              density="comfortable"
              icon="mdi-trash-can-outline"
              size="small"
              variant="tonal"
              @click="remove(user)"
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
import type { RepositoryRole } from '@tailor-cms/interfaces/role';
import type { User } from '@tailor-cms/interfaces/user';

import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

type RepositoryUser = User & { repositoryRole: RepositoryRole };

const props = defineProps<{
  users: RepositoryUser[];
  roles: Array<{ title: string; value: RepositoryRole; description?: string }>;
}>();

const ITEMS_PER_PAGE = 10;

const store = useCurrentRepository();
const notify = useNotification();

const isLoading = ref(true);
const page = ref(1);

const users = computed(() => props.users);

const roleLabel = (value: RepositoryRole) =>
  props.roles.find((r) => r.value === value)?.title ?? value;

const roleIcon = (current: RepositoryRole, value: RepositoryRole) =>
  current === value ? 'mdi-check-circle' : 'mdi-blank';

const getUsers = async () => {
  await store.getUsers();
  isLoading.value = false;
};

const upsertUser = async (email: string, role: RepositoryRole) => {
  await store.upsertUser(email, role);
  await notify('User updated', { immediate: true });
};

const removeUser = async (userId: number) => {
  await store.removeUser(userId);
};

const remove = (user: User) => {
  const showConfirmationModal = useConfirmationDialog();
  showConfirmationModal({
    title: 'Remove user',
    color: 'error',
    message: `Are you sure you want to remove user "${user.email}" from this repository?`,
    action: () => removeUser(user.id),
  });
};

getUsers();
</script>

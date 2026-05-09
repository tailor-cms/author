<template>
  <VAlert
    v-if="!isLoading && !store.users.length"
    class="ma-6"
    color="primary-lighten-3"
    icon="mdi-information-outline"
    variant="tonal"
  >
    No assigned users.
  </VAlert>
  <VList v-else-if="!isLoading" bg-color="transparent" class="user-list pa-0">
    <VListItem
      v-for="user in paginatedUsers"
      :key="user.id"
      class="user-row py-3 px-4 mb-2"
      rounded="lg"
    >
      <template #prepend>
        <VAvatar :image="user.imgUrl" size="34" variant="tonal" />
      </template>
      <VListItemTitle class="text-body-1 font-weight-medium">
        {{ user.label || user.email }}
      </VListItemTitle>
      <VListItemSubtitle v-if="user.fullName" class="text-body-2">
        {{ user.email }}
      </VListItemSubtitle>
      <template #append>
        <VMenu location="bottom end">
          <template #activator="{ props: menuProps }">
            <VBtn
              v-bind="menuProps"
              append-icon="mdi-chevron-down"
              class="user-role-btn mr-2 text-none"
              color="white"
              rounded="pill"
              size="small"
              variant="tonal"
            >
              {{ roleLabel(user.repositoryRole) }}
            </VBtn>
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
          color="white"
          icon="mdi-delete-outline"
          size="small"
          variant="text"
          @click="remove(user)"
        />
      </template>
    </VListItem>
    <VPagination
      v-if="pageCount > 1"
      v-model="page"
      :length="pageCount"
      :total-visible="7"
      active-color="primary-lighten-4"
      class="pt-2"
      color="primary-lighten-3"
      density="comfortable"
      rounded
    />
  </VList>
</template>

<script lang="ts" setup>
import type { User } from '@tailor-cms/interfaces/user';

import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  roles: Array<{ title: string; value: string; description?: string }>;
}>();

const ITEMS_PER_PAGE = 10;

const store = useCurrentRepository();
const notify = useNotification();

const isLoading = ref(true);
const page = ref(1);

const pageCount = computed(() =>
  Math.max(1, Math.ceil(store.users.length / ITEMS_PER_PAGE)),
);

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * ITEMS_PER_PAGE;
  return store.users.slice(start, start + ITEMS_PER_PAGE);
});

const roleLabel = (value: string) =>
  props.roles.find((r) => r.value === value)?.title ?? value;

const roleIcon = (current: string, value: string) =>
  current === value ? 'mdi-check-circle' : 'mdi-blank';

const getUsers = async () => {
  await store.getUsers();
  isLoading.value = false;
};

const upsertUser = async (email: string, role: string) => {
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
    message: `Are you sure you want to remove user "${user.email}" from this repository?`,
    action: () => removeUser(user.id),
  });
};

getUsers();

watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});
</script>

<style lang="scss" scoped>
.user-list {
  background: transparent;
  text-align: left;
}

.user-row {
  background: rgba(var(--v-theme-primary-darken-2));
}
</style>

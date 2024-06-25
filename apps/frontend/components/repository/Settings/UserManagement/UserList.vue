<template>
  <VDataTable
    v-if="!isLoading"
    :headers="headers"
    :items="store.users"
    class="px-6 bg-transparent"
    no-data-text="No assigned users."
  >
    <template #item="{ item }">
      <tr class="user-entry">
        <td class="text-left">
          <VAvatar :image="item.imgUrl" size="32" variant="tonal" />
        </td>
        <td class="text-left user-entry-email">{{ item.email }}</td>
        <td class="user-entry-label text-body-2 text-left text-truncate">
          {{ item.fullName || 'N/A' }}
        </td>
        <td class="user-entry-role">
          <VSelect
            :items="roles"
            :model-value="item.repositoryRole"
            bg-color="transparent"
            density="compact"
            rounded="lg"
            variant="solo"
            flat
            hide-details
            @update:model-value="(role: string) => upsertUser(item.email, role)"
          />
        </td>
        <td class="user-entry-actions">
          <VBtn
            aria-label="Remove user"
            color="blue-grey-darken-3"
            icon="mdi-delete"
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
import type { User } from 'tailor-interfaces/user';

import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

defineProps<{
  roles: Array<{ title: string; value: string }>;
}>();

const store = useCurrentRepository();
const notify = useNotification();

const isLoading = ref(true);
const headers = computed(() =>
  ['User', 'Email', 'Full Name', 'Role', ''].map((text) => ({
    text,
    sortable: false,
  })),
);

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
</script>

<style lang="scss" scoped>
td.text-truncate {
  max-width: 11rem;
}

td.user-entry-role {
  min-width: 6.5rem;
  max-width: 7.5rem;
}
</style>

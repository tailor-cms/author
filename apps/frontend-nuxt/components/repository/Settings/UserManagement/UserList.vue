<template>
  <VDataTable
    v-if="!isLoading"
    :headers="headers"
    :items="store.users"
    class="px-6"
    no-data-text="No assigned users."
  >
    <template #item="{ item }">
      <tr>
        <td class="text-left">
          <VAvatar :image="item.imgUrl" size="40" variant="tonal" />
        </td>
        <td class="text-left">{{ item.email }}</td>
        <td class="text-left text-truncate">
          {{ item.fullName || 'N/A' }}
        </td>
        <td class="role-select">
          <VSelect
            :items="roles"
            :value="item.repositoryRole"
            density="compact"
            rounded="lg"
            variant="plain"
            hide-details
            @change="(role: string) => changeRole(item.email, role)"
          />
        </td>
        <td class="actions">
          <VBtn
            color="grey-darken-3"
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
import debounce from 'lodash/debounce';

import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

defineProps({
  roles: { type: Array, required: true },
});

const store = useCurrentRepository();

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
};

const removeUser = async (userId: number) => {
  await store.removeUser(userId);
};

const changeRole = (email: string, role: string) => {
  debounce(() => upsertUser(email, role), 500);
};

const remove = (user: any) => {
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

td.role-select {
  max-width: 7.5rem;
}

::v-deep .v-input__slot::before {
  border: none !important;
}

::v-deep .v-list.v-sheet {
  text-align: left;
}
</style>

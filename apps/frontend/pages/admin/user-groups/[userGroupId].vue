<template>
  <div class="user-group-users">
    <VRow class="mt-2 py-5">
      <VCol>
        <div class="pl-7 text-subtitle-1 text-primary-darken-4 text-left">
          <VBtn
            class="mr-1"
            icon="mdi-arrow-left"
            size="small"
            variant="text"
            @click="router.back()"
          />
          {{ userGroup?.name }} user group
        </div>
      </VCol>
      <VCol>
        <div class="d-flex justify-end mr-7">
          <UserGroupMembershipDialog
            :user-group-id="userGroupId"
            @save="fetchUsers()"
          />
        </div>
      </VCol>
    </VRow>
    <VDataTable
      v-if="!isLoading"
      :items="userGroupUsers"
      class="px-6 bg-transparent"
      no-data-text="No assigned users."
      hide-default-header
    >
      <template #item="{ item }">
        <tr class="user-entry">
          <td class="text-left">
            <UserAvatar :img-url="item.imgUrl" size="32" />
          </td>
          <td class="text-left user-entry-email">{{ item.email }}</td>
          <td class="user-entry-label text-body-2 text-left text-truncate">
            {{ item.fullName || 'N/A' }}
          </td>
          <td class="user-entry-role">
            <VSelect
              :items="roles"
              :model-value="item.userGroupMember.role"
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
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              @click="removeUser(item.id)"
            />
          </td>
        </tr>
      </template>
    </VDataTable>
  </div>
</template>

<script lang="ts" setup>
import { map } from 'lodash-es';
import { title as titleCase } from 'to-case';
import { UserAvatar } from '@tailor-cms/core-components';
import { UserRole } from '@tailor-cms/common';

import type { User } from '@tailor-cms/interfaces/user';
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import { userGroup as api } from '@/api';
import UserGroupMembershipDialog from '~/components/admin/UserGroupMembershipDialog.vue';

interface Role {
  title: string;
  value: string;
}

definePageMeta({
  name: 'user-group',
});

const route = useRoute();
const router = useRouter();

const isLoading = ref(true);
const userGroupId = parseInt(route.params.userGroupId as string, 10);
const userGroup = ref<UserGroup | null>(null);
const userGroupUsers = ref<User[]>([]);

const roles = computed<Role[]>(() =>
  map([UserRole.ADMIN, UserRole.USER, UserRole.COLLABORATOR], (value) => ({
    title: titleCase(value),
    value,
  })),
);

async function fetchUsers() {
  userGroupUsers.value = await api.fetchUsers(userGroupId);
}

async function upsertUser(email: string, role: string) {
  await api.upsertUser(userGroupId, { email, role });
  await fetchUsers();
}

async function removeUser(userId: number) {
  const showDialog = useConfirmationDialog();
  const confirmation = {
    title: 'Remove user',
    message: 'Are you sure you want to remove user from a group?',
    action: async () => {
      await api.removeUser(userGroupId, userId);
      await fetchUsers();
    },
  };
  showDialog(confirmation);
}

onBeforeMount(async () => {
  userGroup.value = await api.get(userGroupId);
  await fetchUsers();
  isLoading.value = false;
});
</script>

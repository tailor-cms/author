<template>
  <div class="user-group-users">
    <div class="d-flex ga-3 mb-6 align-end">
      <VBtn
        :text="`${userGroup?.name} user group`"
        class="mr-1"
        prepend-icon="mdi-arrow-left"
        size="small"
        variant="text"
        @click="router.back()"
      />
      <VSpacer />
      <UserGroupMembershipDialog
        :user-group-id="userGroupId"
        @save="fetchUsers()"
      />
    </div>
    <VDataTable
      v-if="!isLoading"
      :headers="headers"
      :items="userGroupUsers"
      class="mt-4 rounded-xl"
      no-data-text="No assigned users."
    >
      <template #item="{ item }">
        <tr class="user-entry">
          <td class="text-left">
            <UserAvatar :img-url="item.imgUrl" size="32" />
          </td>
          <td class="text-left user-entry-email">{{ item.email }}</td>
          <td class="user-entry-label text-body-medium text-left text-truncate">
            {{ item.fullName || 'N/A' }}
          </td>
          <td class="user-entry-role text-left">
            <VMenu location="bottom end">
              <template #activator="{ props: menuProps }">
                <VBtn
                  v-bind="menuProps"
                  :prepend-icon="roleMeta(item.userGroupMember.role)?.icon"
                  :text="roleLabel(item.userGroupMember.role)"
                  append-icon="mdi-chevron-down"
                  class="user-role-btn"
                  rounded="lg"
                  size="small"
                  variant="tonal"
                />
              </template>
              <VList max-width="340" nav>
                <VListSubheader>Choose role</VListSubheader>
                <VListItem
                  v-for="role in roles"
                  :key="role.value"
                  :active="item.userGroupMember.role === role.value"
                  :prepend-icon="role.icon"
                  :subtitle="role.description"
                  :title="role.title"
                  class="role-option py-2"
                  @click="upsertUser(item.email, role.value)"
                >
                  <template #append>
                    <VIcon
                      :icon="roleIcon(item.userGroupMember.role, role.value)"
                      color="primary"
                      size="small"
                    />
                  </template>
                </VListItem>
              </VList>
            </VMenu>
          </td>
          <td class="user-entry-actions">
            <VBtn
              aria-label="Remove user"
              color="error"
              density="comfortable"
              icon="mdi-trash-can-outline"
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
import type {
  UserGroup,
  UserGroupMemberWithUser,
} from '@tailor-cms/interfaces/user-group';
import { UserAvatar } from '@tailor-cms/core-components';

import { api } from '@/api';
import UserGroupMembershipDialog from '~/components/admin/UserGroupMembershipDialog.vue';

definePageMeta({
  name: 'user-group',
});

const route = useRoute();
const router = useRouter();

const isLoading = ref(true);
const userGroupId = parseInt(route.params.userGroupId as string, 10);
const userGroup = ref<UserGroup | null>(null);
const userGroupUsers = ref<UserGroupMemberWithUser[]>([]);

const roles = GROUP_ROLES;

const headers: any = [
  { title: 'User', key: 'avatar', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Name', key: 'fullName', sortable: false },
  { title: 'Role', key: 'role', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
];

const roleMeta = (value: string) => roles.find((r) => r.value === value);
const roleLabel = (value: string) => roleMeta(value)?.title ?? value;

const roleIcon = (current: string, value: string) =>
  current === value ? 'mdi-check-circle' : 'mdi-blank';

async function fetchUsers() {
  userGroupUsers.value = await api.userGroup.getUsers({
    params: { id: userGroupId },
  });
}

async function upsertUser(email: string, role: string) {
  await api.userGroup.addUser({
    params: { id: userGroupId },
    body: { emails: [email], role } as any,
  });
  await fetchUsers();
}

async function removeUser(userId: number) {
  const showDialog = useConfirmationDialog();
  const confirmation = {
    title: 'Remove user',
    color: 'error',
    message: 'Are you sure you want to remove user from a group?',
    action: async () => {
      await api.userGroup.removeUser({
        params: { id: userGroupId, userId },
      });
      await fetchUsers();
    },
  };
  showDialog(confirmation);
}

onBeforeMount(async () => {
  userGroup.value = await api.userGroup.get({
    params: { id: userGroupId },
  });
  await fetchUsers();
  isLoading.value = false;
});
</script>

<style lang="scss" scoped>
:deep(.v-list-item-subtitle) {
  -webkit-line-clamp: unset;
}
</style>

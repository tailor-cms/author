<template>
  <div class="user-group-users">
    <VRow class="mt-2 py-5">
      <VCol>
        <div class="pl-7 text-body-large text-left">
          <VBtn
            :text="`${userGroup?.name} user group`"
            class="mr-1"
            prepend-icon="mdi-arrow-left"
            size="small"
            variant="text"
            @click="router.back()"
          />
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
          <td class="user-entry-label text-body-medium text-left text-truncate">
            {{ item.fullName || 'N/A' }}
          </td>
          <td class="user-entry-role">
            <VMenu location="bottom end">
              <template #activator="{ props: menuProps }">
                <VBtn
                  v-bind="menuProps"
                  :prepend-icon="roleMeta(item.userGroupMember.role)?.icon"
                  append-icon="mdi-chevron-down"
                  class="user-role-btn"
                  rounded="lg"
                  size="small"
                  variant="tonal"
                >
                  {{ roleLabel(item.userGroupMember.role) }}
                </VBtn>
              </template>
              <VList max-width="350" nav>
                <VListSubheader>Choose role</VListSubheader>
                <VListItem
                  v-for="role in roles"
                  :key="role.value"
                  :active="item.userGroupMember.role === role.value"
                  :prepend-icon="role.icon"
                  :subtitle="role.description"
                  :title="role.title"
                  class="role-option"
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
import { UserAvatar } from '@tailor-cms/core-components';

import type { User } from '@tailor-cms/interfaces/user';
import type { UserGroup, UserGroupMember } from
  '@tailor-cms/interfaces/user-group';

import { GROUP_ROLES } from '@/utils/groupRoles';
import { userGroup as api } from '@/api';
import UserGroupMembershipDialog from '~/components/admin/UserGroupMembershipDialog.vue';

type GroupMember = User & { userGroupMember: UserGroupMember };

definePageMeta({
  name: 'user-group',
});

const route = useRoute();
const router = useRouter();

const isLoading = ref(true);
const userGroupId = parseInt(route.params.userGroupId as string, 10);
const userGroup = ref<UserGroup | null>(null);
const userGroupUsers = ref<GroupMember[]>([]);

const roles = GROUP_ROLES;

const roleMeta = (value: string) => roles.find((r) => r.value === value);
const roleLabel = (value: string) => roleMeta(value)?.title ?? value;

const roleIcon = (current: string, value: string) =>
  current === value ? 'mdi-check-circle' : 'mdi-blank';

async function fetchUsers() {
  userGroupUsers.value = await api.fetchUsers(userGroupId);
}

async function upsertUser(email: string, role: string) {
  await api.upsertUser(userGroupId, { emails: [email], role });
  await fetchUsers();
}

async function removeUser(userId: number) {
  const showDialog = useConfirmationDialog();
  const confirmation = {
    title: 'Remove user',
    color: 'error',
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

<style lang="scss" scoped>
:deep(.v-list-item-subtitle) {
  -webkit-line-clamp: unset;
}
</style>

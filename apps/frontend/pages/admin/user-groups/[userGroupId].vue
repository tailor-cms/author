<template>
  <div>
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
          {{ userGroup.name }} user group
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
      hide-default-header
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
import map from 'lodash/map.js';
import { title as titleCase } from 'to-case';
import { UserRole } from '@tailor-cms/common';

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
const userGroup = ref<any>({});
const userGroupUsers = ref<any[]>([]);

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
  await api.removeUser(userGroupId, userId);
  await fetchUsers();
}

onBeforeMount(async () => {
  userGroup.value = await api.get(userGroupId);
  await fetchUsers();
  isLoading.value = false;
});
</script>

<template>
  <VLayout class="access-page h-100">
    <VAppBar
      color="primary-darken-3"
      class="px-4"
      border="b surface"
      order="1"
      height="64"
      elevation="0"
    >
      <VBtnToggle
        v-model="selectedTab"
        base-color="white"
        color="primary-lighten-4"
        density="compact"
        variant="tonal"
        mandatory
        rounded="lg"
      >
        <VBtn
          v-for="tab in tabs"
          :key="tab.name"
          :value="tab.name"
          class="text-none"
          size="small"
        >
          {{ tab.label }}
        </VBtn>
      </VBtnToggle>
      <VSpacer />
      <AddUserDialog
        v-if="selectedTab === 'users'"
        :roles="roles"
      />
      <AddUserGroup
        v-else
        :user-groups="(repository?.userGroups as UserGroup[]) ?? []"
      />
    </VAppBar>
    <VMain>
      <VContainer class="access-content pa-4" max-width="1440">
        <UserList v-show="selectedTab === 'users'" :roles="roles" />
        <UserGroupList v-show="selectedTab === 'groups'" />
      </VContainer>
    </VMain>
  </VLayout>
</template>

<script lang="ts" setup>
import { map } from 'lodash-es';
import { role } from '@tailor-cms/common';
import { storeToRefs } from 'pinia';
import { titleCase } from '@tailor-cms/utils';
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

import AddUserDialog from
  '@/components/repository/Settings/UserManagement/AddUserDialog.vue';
import AddUserGroup from
  '@/components/repository/Settings/UserManagement/AddUserGroup.vue';
import UserGroupList from
  '@/components/repository/Settings/UserManagement/UserGroupList.vue';
import UserList from
  '@/components/repository/Settings/UserManagement/UserList.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface Role {
  title: string;
  value: string;
  description?: string;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN:
    'Full access. Edit content, manage users and groups, '
    + 'publish, and delete the repository.',
  AUTHOR:
    'Edit content and structure. Cannot manage access or '
    + 'delete the repository.',
};

definePageMeta({
  name: 'repository-settings-access',
});

const store = useCurrentRepository();
const { repository, users } = storeToRefs(store);

onMounted(() => store.getUsers());

const selectedTab = ref<'users' | 'groups'>('users');

const roles = computed<Role[]>(() =>
  map(role.repository, (value) => ({
    title: titleCase(value),
    value,
    description: ROLE_DESCRIPTIONS[value],
  })),
);

const tabs = computed(() => [
  { name: 'users' as const, label: 'Users', count: users.value.length },
  {
    name: 'groups' as const,
    label: 'Groups',
    count: repository.value?.userGroups?.length ?? 0,
  },
]);
</script>

<template>
  <div>
    <div class="d-flex justify-end pr-4">
      <AddUserDialog :roles="roles" />
    </div>
    <UserList :roles="roles" />
  </div>
</template>

<script lang="ts" setup>
import { map } from 'lodash-es';
import { role } from '@tailor-cms/common';
import { titleCase } from '@tailor-cms/utils';

import AddUserDialog from
  '@/components/repository/Settings/UserManagement/AddUserDialog.vue';
import UserList from
  '@/components/repository/Settings/UserManagement/UserList.vue';

interface Role {
  title: string;
  value: string;
}

definePageMeta({
  name: 'repository-settings-users',
});

const roles = computed<Role[]>(() =>
  map(role.repository, (value) => ({ title: titleCase(value), value })),
);
</script>

<template>
  <div class="py-8 pr-4">
    <div class="d-flex justify-end pr-4">
      <AddUserDialog :roles="roles" />
    </div>
    <UserList :roles="roles" />
  </div>
</template>

<script lang="ts" setup>
import map from 'lodash/map';
import { role } from '@tailor-cms/common';
import { title as titleCase } from 'to-case';

// eslint-disable-next-line max-len
import AddUserDialog from '@/components/repository/Settings/UserManagement/AddUserDialog.vue';
import UserList from '@/components/repository/Settings/UserManagement/UserList.vue';

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

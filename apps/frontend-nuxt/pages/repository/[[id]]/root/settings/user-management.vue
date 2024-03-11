<template>
  <div>
    <div>
      <AddUserDialog :roles="roles" />
    </div>
    <UserList :roles="roles" />
  </div>
</template>

<script lang="ts" setup>
import map from 'lodash/map';
import { role } from 'tailor-config-shared';
import { title as titleCase } from 'to-case';

import AddUserDialog from '@/components/repository/Settings/UserManagement/AddUserDialog.vue';
import UserList from '@/components/repository/Settings/UserManagement/UserList.vue';

definePageMeta({
  name: 'repository-settings-users',
});

const roles = computed(() =>
  map(role.repository, (value) => ({ title: titleCase(value), value })),
);
</script>

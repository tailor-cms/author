<template>
  <div>
    <div class="d-flex justify-end pr-4">
      <AddUserGroup :user-groups="currentRepositoryStore.userGroups" />
    </div>
    <UserGroupList />
  </div>
</template>

<script lang="ts" setup>
import AddUserGroup from
  '@/components/repository/Settings/UserManagement/AddUserGroup.vue';
import UserGroupList from
  '@/components/repository/Settings/UserManagement/UserGroupList.vue';

definePageMeta({
  name: 'repository-settings-groups',
});

const currentRepositoryStore = useCurrentRepository();
</script>

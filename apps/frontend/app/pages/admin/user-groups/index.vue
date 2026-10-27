<template>
  <TailorEmptyState
    v-if="!list.isLoading.value"
    v-bind="emptyState"
    class="mt-4"
    @click:action="list.openCreateDialog"
  />
</template>

<script lang="ts" setup>
import { TailorEmptyState } from '@tailor-cms/core-components';

import { useAuthStore } from '@/stores/auth';

definePageMeta({ name: 'user-groups' });
useHead({ title: 'User group management' });

const authStore = useAuthStore();
const list = useUserGroupList();

const hasGroups = computed(() => !!list.total.value || !!list.search.value);

const emptyState = computed(() => {
  if (hasGroups.value) {
    return {
      icon: 'mdi-account-group-outline',
      text: 'Pick a group from the list to manage its members.',
      title: 'Select a user group',
    };
  }
  return {
    icon: 'mdi-account-group-outline',
    text: 'Create a user group to get started.',
    title: 'No user groups',
    ...(authStore.canCreateUserGroups && {
      actionText: 'Add user group',
      prependActionIcon: 'mdi-plus',
    }),
  };
});
</script>

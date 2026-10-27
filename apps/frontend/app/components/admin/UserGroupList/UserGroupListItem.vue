<template>
  <VListItem
    :active="isSelected"
    :subtitle="summary"
    :title="group.name"
    class="user-group-entry"
    data-testid="user-group-entry"
    prepend-gap="12"
    rounded="lg"
    @click="emit('select', group.id)"
  >
    <template #prepend>
      <UserGroupAvatar :logo-url="group.logoUrl" size="36" />
    </template>
    <template v-if="hasActions" #append>
      <VMenu location="bottom end" offset="4">
        <template #activator="{ props: menuProps }">
          <VBtn
            v-bind="menuProps"
            aria-label="User group actions"
            class="user-group-actions"
            density="comfortable"
            icon="mdi-dots-vertical"
            size="small"
            variant="text"
            @click.stop
          />
        </template>
        <VList density="compact" min-width="160" nav>
          <VListItem
            prepend-icon="mdi-square-edit-outline"
            title="Edit"
            rounded="lg"
            @click="emit('edit:group', group)"
          />
          <VListItem
            base-color="error"
            prepend-icon="mdi-trash-can-outline"
            title="Delete"
            rounded="lg"
            @click="emit('delete:group', group)"
          />
        </VList>
      </VMenu>
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import pluralize from 'pluralize-esm';

import type { UserGroupRow } from './types';
import UserGroupAvatar from '@/components/common/UserGroupAvatar.vue';

const props = defineProps<{
  group: UserGroupRow;
  isSelected: boolean;
  hasActions: boolean;
}>();

const emit = defineEmits<{
  'select': [id: number];
  'edit:group': [group: UserGroupRow];
  'delete:group': [group: UserGroupRow];
}>();

const summary = computed(() => {
  const members = pluralize('member', props.group.memberCount ?? 0, true);
  const repos = pluralize('repository', props.group.repositoryCount ?? 0, true);
  return `${members} · ${repos}`;
});
</script>

<style lang="scss" scoped>
.user-group-entry {
  .user-group-actions {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover,
  &:focus-within,
  &.v-list-item--active {
    .user-group-actions {
      opacity: 1;
    }
  }
}
</style>

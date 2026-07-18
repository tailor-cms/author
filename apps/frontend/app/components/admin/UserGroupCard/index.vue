<template>
  <VCard
    :ripple="false"
    class="group-card d-flex align-center pa-4 text-left"
    data-testid="user-group-card"
    color="surface-raised"
    elevation="1"
    rounded="lg"
    @click="navigateTo({ name: 'user-group', params: { userGroupId: group.id } })"
  >
    <UserGroupAvatar :logo-url="group.logoUrl" size="52" />
    <div class="ml-4 overflow-hidden flex-grow-1">
      <div class="group-name text-title-medium font-weight-medium">
        {{ group.name }}
      </div>
      <div class="text-label-medium text-medium-emphasis mt-1">
        {{ summary }}
      </div>
    </div>
    <VMenu v-if="hasActions" location="bottom end" offset="4">
      <template #activator="{ props: menuProps }">
        <VBtn
          v-tooltip:top="{ text: 'User group actions', openDelay: 400 }"
          v-bind="menuProps"
          aria-label="User group actions"
          class="ml-2"
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
          @click.stop="emit('edit:group', group)"
        />
        <VListItem
          base-color="error"
          prepend-icon="mdi-trash-can-outline"
          title="Delete"
          rounded="lg"
          @click.stop="emit('delete:group', group)"
        />
      </VList>
    </VMenu>
  </VCard>
</template>

<script lang="ts" setup>
import pluralize from 'pluralize-esm';
import UserGroupAvatar from '@/components/common/UserGroupAvatar.vue';
import type { UserGroupRow } from './types';

const props = defineProps<{
  group: UserGroupRow;
  hasActions: boolean;
}>();

const emit = defineEmits<{
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
.group-card {
  height: 6rem;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  .group-name {
    line-height: 1.3;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    white-space: normal;
  }
}
</style>

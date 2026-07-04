<template>
  <VMenu>
    <template #activator="activator">
      <slot name="activator" v-bind="activator" />
    </template>
    <VList density="compact" max-height="320" min-width="220" nav>
      <VListItem
        :active="!activity.currentStatus.assigneeId"
        @click="update(activity, 'assigneeId', null)"
      >
        <template #prepend>
          <UserAvatar size="26" />
        </template>
        <VListItemTitle>Unassigned</VListItemTitle>
      </VListItem>
      <VListItem
        v-for="user in users"
        :key="user.id"
        :active="user.id === activity.currentStatus.assigneeId"
        @click="update(activity, 'assigneeId', user.id)"
      >
        <template #prepend>
          <UserAvatar :img-url="user.imgUrl" size="26" />
        </template>
        <VListItemTitle>{{ user.label }}</VListItemTitle>
      </VListItem>
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import { UserAvatar } from '@tailor-cms/core-components';

import { useStatusUpdate } from './useStatusUpdate';
import { useCurrentRepository } from '@/stores/current-repository';

defineProps<{
  activity: StoreActivity;
}>();

const { users } = storeToRefs(useCurrentRepository());
const update = useStatusUpdate();
</script>

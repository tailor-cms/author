<template>
  <VMenu>
    <template #activator="activator">
      <div
        v-bind="activator.props"
        :aria-label="`Assignee: ${label}`"
        :class="compact ? 'd-inline-flex' : 'd-flex overflow-hidden'"
        class="cursor-pointer align-center ga-2"
        role="button"
        tabindex="0"
        @click.stop
      >
        <UserAvatar
          :img-url="assignee?.imgUrl"
          :label="label"
          :size="size"
          class="flex-shrink-0"
        />
        <span v-if="!compact" class="assignee-label">
          {{ label }}
        </span>
      </div>
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

const props = withDefaults(
  defineProps<{
    activity: StoreActivity;
    compact?: boolean;
    size?: string | number;
  }>(),
  { size: 24 },
);

const { users } = storeToRefs(useCurrentRepository());
const update = useStatusUpdate();

const assignee = computed(() => props.activity.currentStatus.assignee);
const label = computed(() => assignee.value?.label ?? 'Unassigned');
</script>

<style lang="scss" scoped>
// Let long emails wrap within the cell instead of overflowing into the next
// column; overflow-wrap: anywhere breaks the address (which has no spaces).
.assignee-label {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>

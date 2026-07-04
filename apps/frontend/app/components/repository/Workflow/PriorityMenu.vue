<template>
  <VMenu>
    <template #activator="activator">
      <slot name="activator" v-bind="activator" />
    </template>
    <VList density="compact" min-width="180" nav>
      <VListItem
        v-for="option in priorities"
        :key="option.id"
        :active="option.id === activity.currentStatus.priority"
        @click="update(activity, 'priority', option.id)"
      >
        <template #prepend>
          <VIcon :color="option.color" :icon="option.icon" />
        </template>
        <VListItemTitle>{{ option.label }}</VListItemTitle>
      </VListItem>
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import { workflow as workflowConfig } from '@tailor-cms/config';

import { useStatusUpdate } from './useStatusUpdate';

defineProps<{
  activity: StoreActivity;
}>();

const priorities = workflowConfig.priorities;
const update = useStatusUpdate();
</script>

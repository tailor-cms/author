<template>
  <VMenu>
    <template #activator="activator">
      <VBtn
        v-if="compact"
        v-tooltip:bottom="priority?.label"
        v-bind="activator.props"
        :aria-label="ariaLabel"
        :color="priority?.color"
        size="26"
        variant="tonal"
        icon
        @click.stop
      >
        <VIcon :icon="priority?.icon" size="16" />
      </VBtn>
      <VChip
        v-else
        v-bind="activator.props"
        :aria-label="ariaLabel"
        :color="priority?.color"
        class="cursor-pointer"
        density="comfortable"
        role="button"
        tabindex="0"
        size="small"
        rounded
        @click.stop
      >
        <VIcon :icon="priority?.icon" start />
        {{ priority?.label }}
      </VChip>
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

const props = defineProps<{
  activity: StoreActivity;
  compact?: boolean;
}>();

const priorities = workflowConfig.priorities;
const update = useStatusUpdate();

const priority = computed(() =>
  workflowConfig.getPriority(props.activity.currentStatus.priority),
);
const ariaLabel = computed(() =>
  priority.value ? `Priority: ${priority.value.label}` : 'Priority',
);
</script>

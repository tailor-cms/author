<template>
  <VMenu>
    <template #activator="activator">
      <slot name="activator" v-bind="activator">
        <VChip
          v-bind="activator.props"
          :text="currentStatus?.label"
          append-icon="mdi-menu-down"
          class="cursor-pointer"
          size="small"
          rounded
          @click.stop
        >
          <template #prepend>
            <VIcon
              :color="currentStatus?.color"
              icon="mdi-circle"
              size="small"
              start
            />
          </template>
        </VChip>
      </slot>
    </template>
    <VList density="compact" min-width="180" nav>
      <VListItem
        v-for="option in workflow.statuses"
        :key="option.id"
        :active="option.id === activity.currentStatus.status"
        @click="update(activity, 'status', option.id)"
      >
        <template #prepend>
          <VIcon :color="option.color" icon="mdi-circle" size="small" />
        </template>
        <VListItemTitle>{{ option.label }}</VListItemTitle>
      </VListItem>
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import type { StatusConfig } from '@tailor-cms/interfaces/activity';

import { useStatusUpdate } from './useStatusUpdate';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activity: StoreActivity;
}>();

const { workflow } = storeToRefs(useCurrentRepository());
const update = useStatusUpdate();

const currentStatus = computed(() =>
  workflow.value?.statuses.find(
    (it: StatusConfig) => it.id === props.activity.currentStatus.status,
  ),
);
</script>

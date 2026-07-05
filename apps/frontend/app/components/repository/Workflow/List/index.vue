<template>
  <div class="workflow-list">
    <TailorEmptyState
      v-if="!items.length"
      class="mt-4"
      icon="mdi-clipboard-text-outline"
      text="No activities match the current filters."
      title="No items"
    />
    <Draggable
      v-else
      :list="items"
      animation="150"
      class="workflow-list__items"
      item-key="uid"
      @change="onChange"
    >
      <template #item="{ element }">
        <ListItem :activity="element" @select="selectActivity" />
      </template>
    </Draggable>
  </div>
</template>

<script lang="ts" setup>
import { calculatePosition } from '@tailor-cms/utils';
import Draggable from 'vuedraggable';
import { orderBy } from 'lodash-es';
import { TailorEmptyState } from '@tailor-cms/core-components';

import type { ChangeEvent } from '@/types/draggable';
import ListItem from './ListItem.vue';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activities: StoreActivity[];
}>();

const notify = useNotification();
const repositoryStore = useCurrentRepository();
const activityStore = useActivityStore();

// Workflow position; null when never set — fall back to the id axis.
const positionOf = (it: StoreActivity) => it.currentStatus.position ?? it.id;

const items = computed(() =>
  orderBy(props.activities, [positionOf, 'id']),
);

const selectActivity = (id: number) => repositoryStore.selectActivity(id);

async function onChange(event: ChangeEvent<StoreActivity>) {
  const { moved } = event;
  if (!moved) return;
  const { element: activity, newIndex: newPosition } = moved;
  const positions = items.value.map((it) => ({ position: positionOf(it) }));
  const position = calculatePosition({ items: positions as any, newPosition });
  try {
    await activityStore.saveStatus(activity.id, { position });
  } catch {
    notify('Failed to save order', { immediate: true });
  }
}
</script>

<style lang="scss" scoped>
// The page pane is height-bounded; rows scroll under the pinned filter bar.
.workflow-list {
  min-height: 0;
  overflow-y: auto;
}

.workflow-list__items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>

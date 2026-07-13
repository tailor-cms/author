<template>
  <div class="workflow-board d-flex ga-3 mx-n4 mx-md-n10 px-4 px-md-10">
    <VSheet
      v-for="status in statuses"
      :key="status.id"
      class="board-column d-flex flex-column"
      color="surface-sunken"
      min-height="0"
      min-width="270"
      max-width="416"
      rounded="16"
    >
      <div class="board-column__header d-flex align-center ga-2 px-4 pt-4 pb-3">
        <VIcon :color="status.color" icon="mdi-circle" size="x-small" />
        <span class="text-label-medium font-weight-semibold text-uppercase">
          {{ status.label }}
        </span>
        <VSpacer />
        <VChip
          :text="columns[status.id]?.length ?? 0"
          class="ml-1 font-weight-bold"
          color="tertiary"
          size="x-small"
          rounded="lg"
        />
      </div>
      <Draggable
        :group="{ name: 'workflow-board' }"
        :list="columns[status.id]"
        animation="150"
        class="board-column__list d-flex flex-column ga-2 px-3 pb-4"
        item-key="uid"
        @change="(e: ChangeEvent<StoreActivity>) => onChange(e, status.id)"
      >
        <template #item="{ element }">
          <BoardCard :activity="element" @select="selectActivity" />
        </template>
      </Draggable>
    </VSheet>
  </div>
</template>

<script lang="ts" setup>
import { groupBy, orderBy } from 'lodash-es';
import { calculatePosition } from '@tailor-cms/utils';
import type { StatusConfig } from '@tailor-cms/interfaces/activity';
import Draggable from 'vuedraggable';

import type { ChangeEvent } from '@/types/draggable';
import BoardCard from './Card.vue';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activities: StoreActivity[];
  statuses: StatusConfig[];
}>();

const notify = useNotification();
const repositoryStore = useCurrentRepository();
const activityStore = useActivityStore();

// Workflow position; null when never set — fall back to the id axis.
const positionOf = (it: StoreActivity) => it.currentStatus.position ?? it.id;

const columns = computed<Record<string, StoreActivity[]>>(() => {
  const grouped = groupBy(props.activities, (it) => it.currentStatus.status);
  const entries = props.statuses.map((status) => [
    status.id,
    orderBy(grouped[status.id] ?? [], [positionOf, 'id']),
  ]);
  return Object.fromEntries(entries);
});

const selectActivity = (id: number) => repositoryStore.selectActivity(id);

// Cross-column drops fire `added` (status + position), within-column reorders
// fire `moved` (position only); the source `removed` is ignored as a dupe.
async function onChange(event: ChangeEvent<StoreActivity>, statusId: string) {
  const change = event.added ?? event.moved;
  if (!change) return;
  const { element: activity, newIndex: newPosition } = change;
  const items = columns.value[statusId]!.map((it) => ({ position: positionOf(it) }));
  const position = calculatePosition({ items: items as any, newPosition });
  const isStatusChange = activity.currentStatus.status !== statusId;
  try {
    await activityStore.saveStatus(activity.id, { status: statusId, position });
    if (isStatusChange) notify('Status saved', { immediate: true });
  } catch {
    notify('Failed to update status', { immediate: true });
  }
}
</script>

<style lang="scss" scoped>
// Full-bleed horizontal scroller: the board spans the full container width and
// carries the page inset as its own padding, so columns scroll edge-to-edge
// with breathing room at the start/end instead of being clipped against the
// container's padding with dead space beside them.
.workflow-board {
  align-items: stretch;
  min-height: 0;
  overflow-x: auto;
}

.board-column {
  display: flex;
  flex: 1 1 0;
  overflow: hidden;
}

.board-column__header {
  flex: 0 0 auto;
}

.board-column__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
</style>

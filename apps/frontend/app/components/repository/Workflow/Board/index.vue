<template>
  <div class="workflow-board d-flex ga-3 mx-n4 mx-md-n10 px-4 px-md-10">
    <VSheet
      v-for="status in statuses"
      :key="status.id"
      class="board-column d-flex flex-column"
      color="surface-container-high"
      elevation="1"
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
        <VChip class="ml-1" size="x-small" variant="tonal" rounded="lg">
          {{ columns[status.id]?.length ?? 0 }}
        </VChip>
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
  // Columns to render; the page narrows these when the status filter is
  // active (status filter = column focus on the board).
  statuses: StatusConfig[];
}>();

const notify = useNotification();
const repositoryStore = useCurrentRepository();
const activityStore = useActivityStore();

// Workflow rank; null = never manually ranked, fall back to the id axis.
const rankOf = (it: StoreActivity) => it.currentStatus.position ?? it.id;

// vuedraggable mutates the per-column lists in place, so we keep a local copy
// grouped by status id and re-derive it whenever the source activities change.
const columns = reactive<Record<string, StoreActivity[]>>({});

function syncColumns() {
  const grouped = groupBy(props.activities, (it) => it.currentStatus.status);
  props.statuses.forEach((status) => {
    columns[status.id] = orderBy(grouped[status.id] ?? [], rankOf);
  });
}

watch(() => [props.activities, props.statuses], syncColumns, {
  immediate: true,
});

const selectActivity = (id: number) => repositoryStore.selectActivity(id);

// Persists cross-column drops (`added`: status + rank) and within-column
// reorders (`moved`: rank only). The source column's `removed` event is
// ignored to avoid a duplicate update.
async function onChange(event: ChangeEvent<StoreActivity>, statusId: string) {
  const change = event.added ?? event.moved;
  if (!change) return;
  const { element: activity, newIndex } = change;
  // The list already contains the card at its drop index; `calculatePosition`
  // splices it out and ranks it between its new neighbours.
  const items = columns[statusId]!.map((it) => ({ position: rankOf(it) }));
  const position = calculatePosition({
    items: items as any,
    newPosition: newIndex,
  });
  const isStatusChange = activity.currentStatus.status !== statusId;
  try {
    await activityStore.saveStatus(activity.id, {
      ...activity.currentStatus,
      status: statusId,
      position,
    });
    if (isStatusChange) notify('Status saved', { immediate: true });
  } catch {
    notify('Failed to update status', { immediate: true });
    syncColumns();
  }
}
</script>

<style lang="scss" scoped>
// Full-bleed horizontal scroller: the board spans the full container width and
// carries the page inset as its own padding (see template `px-*`), so columns
// scroll edge-to-edge with breathing room at the start/end instead of being
// clipped against the container's padding with dead space beside them.
.workflow-board {
  align-items: stretch;
  min-height: 0;
  overflow-x: auto;
}

// Unified column panel: a recessed well that fills the available height and
// stays put. The header is pinned at the top; only the card list scrolls.
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

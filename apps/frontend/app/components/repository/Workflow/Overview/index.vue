<template>
  <VDataTable
    :headers="headers"
    :items="items"
    :row-props="({ item }) => ({ class: item.class })"
    class="bg-primary-darken-2 rounded-lg text-left"
    items-per-page="25"
    fixed-header
    @click:row="selectActivity"
  >
    <template #[`item.status`]="{ item: { status } }">
      <VChip size="small" rounded>
        <VIcon :color="status.color" icon="mdi-circle" size="small" start />
        {{ status.label }}
      </VChip>
    </template>
    <template #[`item.assignee`]="{ item: { assignee } }">
      <div class="d-flex align-center gap-1">
        <UserAvatar
          :img-url="assignee?.imgUrl"
          color="primary-lighten-4"
          size="x-small"
          start
        />
        {{ assignee?.label ?? 'Unassigned' }}
      </div>
    </template>
    <template #[`item.priority`]="{ item: { priority } }">
      <VChip :color="priority.color" size="small" rounded>
        <VIcon :icon="priority.icon" size="x-large" start />
        <div class="text-white">{{ priority.label }}</div>
      </VChip>
    </template>
    <template #[`item.dueDate`]="{ item }">
      <OverviewDueDate v-if="item.dueDate" :date="item.dueDate" />
    </template>
  </VDataTable>
</template>

<script lang="ts" setup>
import type { StatusConfig } from '@tailor-cms/interfaces/activity';
import type { User } from '@tailor-cms/interfaces/user';
import { UserAvatar } from '@tailor-cms/core-components';
import { workflow as workflowConfig } from '@tailor-cms/config';

import OverviewDueDate from './DueDate.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface PriorityConfig extends StatusConfig {
  icon: string;
}

const props = defineProps<{
  activities: StoreActivity[];
}>();

const repositoryStore = useCurrentRepository();
const { workflow, selectedActivity } = storeToRefs(repositoryStore);

const headers = computed(() => [
  { title: 'Name', value: 'name', sortable: true, maxWidth: '17.75rem' },
  {
    title: 'Status',
    value: 'status',
    sort: compareStatuses,
    width: '8.125rem',
  },
  {
    title: 'Assignee',
    value: 'assignee',
    sort: compareAssignees,
    maxWidth: '11.5rem',
  },
  { title: 'Priority', value: 'priority', sort: comparePriorities },
  { title: 'Due date', value: 'dueDate', sortable: true },
]);

const items = computed(() =>
  props.activities.map(({ id, data, currentStatus }) => ({
    ...currentStatus,
    id,
    name: data.name,
    status: getStatusById(currentStatus.status),
    priority: workflowConfig.getPriority(currentStatus.priority),
    class: isActivitySelected(id) && 'selected',
  })),
);

const selectActivity = (_event: Event, { item }: any) => {
  repositoryStore.selectActivity(item.id);
};

function isActivitySelected(id: number) {
  return selectedActivity.value && selectedActivity.value.id === id;
}

function getStatusById(id: string) {
  return workflow.value.statuses.find((it: StatusConfig) => it.id === id);
}

function compareStatuses(first: StatusConfig, second: StatusConfig) {
  const statusIds = workflow.value.statuses.map((it: StatusConfig) => it.id);
  return statusIds.indexOf(first.id) - statusIds.indexOf(second.id);
}

function compareAssignees(first: User, second: User) {
  if (!second || !second.label) return -1;
  if (!first || !first.label) return 1;
  return first.label.localeCompare(second.label);
}

function comparePriorities(first: PriorityConfig, second: PriorityConfig) {
  const priorityIds = workflowConfig.priorities.map((it) => it.id);
  return priorityIds.indexOf(second.id) - priorityIds.indexOf(first.id);
}
</script>

<style lang="scss" scoped>
.v-data-table {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.v-table__wrapper) {
    flex: 1 1 auto;
  }
}

.v-table {
  line-height: 1.25;

  :deep(td) {
    padding: 0.5rem 1rem !important;
  }
}

:deep(tbody) tr {
  transition: background-color 0.3s ease;

  &.selected,
  &:hover {
    background: rgba(var(--v-theme-primary-darken-1)) !important;
  }

  &.selected {
    pointer-events: none;
  }
}

.v-table :deep(th) {
  background: rgba(var(--v-theme-primary-darken-2)) !important;

  &:hover {
    font-weight: bold;
    color: white !important;
  }
}
</style>

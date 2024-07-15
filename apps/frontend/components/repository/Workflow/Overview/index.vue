<template>
  <VDataTable
    :headers="headers"
    :items="items"
    :row-props="({ item }) => ({ class: item.class })"
    class="rounded-lg bg-primary-darken-2 text-left overflow-y-auto"
    items-per-page="100"
    fixed-header
    hide-default-footer
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
import type { User } from '@tailor-cms/interfaces/user';
import { UserAvatar } from '@tailor-cms/core-components-next';
import { workflow as workflowConfig } from 'tailor-config-shared';

import OverviewDueDate from './DueDate.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface StatusConfig {
  id: string;
  label: string;
  color: string;
  default?: boolean;
}

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
  { title: 'Status', value: 'status', sort: compareStatuses },
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
  props.activities.map(({ id, data, status }) => ({
    ...status,
    id,
    name: data.name,
    status: getStatusById(status.status),
    priority: workflowConfig.getPriority(status.priority),
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
    opacity: 1;
    font-weight: bold;
    color: white !important;
  }
}
</style>

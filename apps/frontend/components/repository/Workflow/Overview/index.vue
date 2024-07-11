<template>
  <VDataTable
    :headers="headers"
    :items="items"
    :row-props="
      ({ item }) => ({ class: isActivitySelected(item.id) && 'selected' })
    "
    class="rounded-lg bg-primary-lighten-5 text-left"
    height="100%"
    items-per-page="100"
    fixed-header
    hide-default-footer
    variant
    @click:row="selectActivity"
  >
    <template #item.name="{ item }">
      <OverviewName :name="item.name" />
    </template>
    <template #item.status="{ item }">
      <OverviewStatus :color="item.status.color" :label="item.status.label" />
    </template>
    <template #item.assignee="{ item }">
      <OverviewAssignee
        :img-url="item.assignee?.imgUrl"
        :label="item.assignee?.label"
      />
    </template>
    <template #item.priority="{ item }">
      <OverviewPriority
        :color="item.priority.color"
        :icon="item.priority.icon"
        :label="item.priority.label"
      />
    </template>
    <template #item.dueDate="{ item }">
      <OverviewDueDate v-if="item.dueDate" :date="item.dueDate" />
    </template>
  </VDataTable>
</template>

<script lang="ts" setup>
import type { Activity } from '@tailor-cms/interfaces/activity';
import { workflow as workflowConfig } from 'tailor-config-shared';

import OverviewAssignee from './Assignee.vue';
import OverviewDueDate from './DueDate.vue';
import OverviewName from './Name.vue';
import OverviewPriority from './Priority.vue';
import OverviewStatus from './Status.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activities: Activity[];
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

function isActivitySelected(id) {
  return selectedActivity.value && selectedActivity.value.id === id;
}

function getStatusById(id) {
  return workflow.value.statuses.find((it) => it.id === id);
}

function compareStatuses(first, second) {
  const statusIds = workflow.value.statuses.map((it) => it.id);
  return statusIds.indexOf(first.id) - statusIds.indexOf(second.id);
}

function compareAssignees(first, second) {
  if (!second || !second.label) return -1;
  if (!first || !first.label) return 1;
  return first.label.localeCompare(second.label);
}

function comparePriorities(first, second) {
  const priorityIds = workflowConfig.priorities.map((it) => it.id);
  return priorityIds.indexOf(second.id) - priorityIds.indexOf(first.id);
}
</script>

<style lang="scss" scoped>
:deep(tr) {
  transition: background-color 0.3s ease;

  &.selected,
  &:hover {
    background: rgba(var(--v-theme-primary-lighten-4)) !important;
  }

  &.selected {
    pointer-events: none;
  }
}

.column-name {
  max-width: 17.75rem;
}

.column-assignee {
  max-width: 11.5rem;
}
</style>

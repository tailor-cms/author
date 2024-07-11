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
    @click:row="(_, { item }) => repositoryStore.selectActivity(item.id)"
  >
    <template #item.name="{ item }">
      <OverviewName :value="item.name" />
    </template>
    <template #item.status="{ item }">
      <OverviewStatus v-bind="item.status" />
    </template>
    <template #item.assignee="{ item }">
      <OverviewAssignee v-bind="item.assignee" />
    </template>
    <template #item.priority="{ item }">
      <OverviewPriority v-bind="item.priority" />
    </template>
    <template #item.dueDate="{ item }">
      <OverviewDueDate v-if="item.dueDate" :value="item.dueDate" />
    </template>
  </VDataTable>
</template>

<script lang="ts" setup>
// import { ref, computed } from 'vue';
// import { useStore } from 'vuex';

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

<template>
  <VDataTable
    ref="tableEl"
    :headers="headers"
    :items="items"
    :row-props="({ item }) => ({ class: item.class })"
    class="bg-surface-raised rounded-lg text-left elevation-1"
    items-per-page="-1"
    fixed-header
    hide-default-footer
    @click:row="selectRow"
  >
    <template #[`item.id`]="{ item: { activity } }">
      <span class="text-body-small text-medium-emphasis">
        {{ activity.shortId }}
      </span>
    </template>
    <template #[`item.type`]="{ item: { type } }">
      <div class="d-inline-flex align-center ga-2">
        {{ type?.label }}
      </div>
    </template>
    <template #[`item.status`]="{ item: { activity } }">
      <StatusMenu :activity="activity" />
    </template>
    <template #[`item.assignee`]="{ item: { activity, assignee } }">
      <AssigneeMenu :activity="activity">
        <template #activator="{ props: menuProps }">
          <div
            v-bind="menuProps"
            class="d-inline-flex align-center ga-2 cursor-pointer"
            @click.stop
          >
            <UserAvatar :img-url="assignee?.imgUrl" size="22" />
            {{ assignee?.label ?? 'Unassigned' }}
          </div>
        </template>
      </AssigneeMenu>
    </template>
    <template #[`item.priority`]="{ item: { activity, priority } }">
      <PriorityMenu :activity="activity">
        <template #activator="{ props: menuProps }">
          <VChip
            v-bind="menuProps"
            :color="priority?.color"
            size="small"
            rounded
            @click.stop
          >
            <VIcon :icon="priority?.icon" size="x-large" start />
            <div class="text-inverse-surface">{{ priority?.label }}</div>
          </VChip>
        </template>
      </PriorityMenu>
    </template>
    <template #[`item.dueDate`]="{ item }">
      <DueDate v-if="item.dueDate" :date="item.dueDate" />
    </template>
    <template #[`item.published`]="{ item: { activity } }">
      <PublishingBadge :activity="activity" />
    </template>
  </VDataTable>
</template>

<script lang="ts" setup>
import type { StatusConfig } from '@tailor-cms/interfaces/activity';
import type { User } from '@tailor-cms/interfaces/user';
import { UserAvatar } from '@tailor-cms/core-components';
import { workflow as workflowConfig } from '@tailor-cms/config';

import AssigneeMenu from '../AssigneeMenu.vue';
import DueDate from '../DueDate.vue';
import PriorityMenu from '../PriorityMenu.vue';
import StatusMenu from '../StatusMenu.vue';
import PublishingBadge from '../../Sidebar/PublishingBadge.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface PriorityConfig extends StatusConfig {
  icon: string;
}

interface TypeConfig extends StatusConfig {
  type: string;
}

const props = defineProps<{
  activities: StoreActivity[];
}>();

const repositoryStore = useCurrentRepository();
const { workflow, selectedActivity, workflowTypes, hasMultipleWorkflowTypes } =
  storeToRefs(repositoryStore);

const tableEl = ref<{ $el: HTMLElement } | null>(null);

const headers = computed(() => [
  // Sorts on the numeric id (creation order); the hashed shortId is only
  // the display value.
  { title: 'ID', value: 'id', sortable: true, width: '5.5rem' },
  { title: 'Name', value: 'name', sortable: true, maxWidth: '20rem' },
  ...(hasMultipleWorkflowTypes.value
    ? [{ title: 'Type', value: 'type', sort: compareTypes }]
    : []),
  {
    title: 'Status',
    value: 'status',
    sort: compareStatuses,
    width: '10rem',
  },
  {
    title: 'Assignee',
    value: 'assignee',
    sort: compareAssignees,
    maxWidth: '11.5rem',
  },
  { title: 'Priority', value: 'priority', sort: comparePriorities },
  { title: 'Due date', value: 'dueDate', sortable: true },
  // Icon-only; the badge tooltip explains the state, and the Unpublished
  // filter chip covers the "group changed items" query a sort would serve.
  { title: '', value: 'published', sortable: false, width: '3rem' },
]);

const items = computed(() =>
  props.activities.map((activity) => ({
    id: activity.id,
    activity,
    name: activity.data.name,
    type: getTypeById(activity.type),
    status: getStatusById(activity.currentStatus.status),
    assignee: activity.currentStatus.assignee,
    priority: workflowConfig.getPriority(activity.currentStatus.priority),
    dueDate: activity.currentStatus.dueDate,
    class: isActivitySelected(activity.id) && 'selected',
  })),
);

const selectRow = (_event: Event, { item }: any) => {
  repositoryStore.selectActivity(item.id);
};

const selectedRow = () =>
  tableEl.value?.$el.querySelector<HTMLElement>('tbody tr.selected');

useScrollWhenSelected(
  selectedRow,
  computed(() => selectedActivity.value?.id),
);

function isActivitySelected(id: number) {
  return selectedActivity.value && selectedActivity.value.id === id;
}

function getStatusById(id: string) {
  return workflow.value.statuses.find((it: StatusConfig) => it.id === id);
}

function getTypeById(type: string) {
  return workflowTypes.value.find((it: TypeConfig) => it.type === type);
}

function compareStatuses(first: StatusConfig, second: StatusConfig) {
  const statusIds = workflow.value.statuses.map((it: StatusConfig) => it.id);
  return statusIds.indexOf(first.id) - statusIds.indexOf(second.id);
}

function compareTypes(first: TypeConfig, second: TypeConfig) {
  const typeIds = workflowTypes.value.map((it: TypeConfig) => it.type);
  return typeIds.indexOf(first?.type) - typeIds.indexOf(second?.type);
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
// Content-sized but height-capped: grows with rows until the pane is full,
// then the body scrolls under the fixed header (no pagination).
.v-data-table {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  :deep(.v-table__wrapper) {
    flex: 1 1 auto;
  }
}

.v-table {
  line-height: 1.25;

  :deep(td) {
    padding: 0.5rem 1rem;
  }
}

:deep(tbody) tr {
  transition: background-color 0.3s ease;

  &.selected,
  &:hover {
    background: rgba(var(--v-theme-surface-container-high));
  }
}

.v-table :deep(th) {
  background: rgba(var(--v-theme-surface-raised));
}
</style>

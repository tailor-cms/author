<template>
  <VLayout class="workflow-page h-100">
    <VMain scrollable>
      <VContainer
        class="workflow d-flex flex-column px-md-10 py-md-8"
        max-width="1200"
      >
        <div v-if="workflow" class="d-flex align-center ga-2 mb-4">
          <WorkflowFilters
            v-model:assignee-ids="filters.assigneeIds"
            v-model:recent-only="filters.recentOnly"
            v-model:search="filters.search"
            v-model:status="filters.status"
            v-model:priority="filters.priority"
            v-model:type="filters.type"
            :assignee-options="assignees"
            :status-options="workflow.statuses"
            :type-options="types"
            class="flex-grow-1"
          />
          <VBtnToggle
            v-model="view"
            class="flex-shrink-0"
            color="secondary"
            density="compact"
            variant="outlined"
            mandatory
          >
            <VBtn
              v-tooltip:bottom="'Board view'"
              class="px-4"
              icon="mdi-view-column-outline"
              size="small"
              value="board"
            />
            <VBtn
              v-tooltip:bottom="'List view'"
              class="px-4"
              icon="mdi-view-list-outline"
              size="small"
              value="list"
            />
            <VBtn
              v-tooltip:bottom="'Table view'"
              class="px-4"
              icon="mdi-table"
              size="small"
              value="table"
            />
          </VBtnToggle>
        </div>
        <WorkflowBoard
          v-if="view === 'board'"
          :activities="filteredActivities"
          :statuses="visibleStatuses"
          class="mt-4 flex-grow-1"
        />
        <WorkflowList
          v-else-if="view === 'list'"
          :activities="filteredActivities"
          class="mt-4 flex-grow-1"
        />
        <WorkflowTable
          v-else
          :activities="filteredActivities"
          class="mt-4"
        />
      </VContainer>
    </VMain>
    <Sidebar />
  </VLayout>
</template>

<script lang="ts" setup>
import { compact, orderBy, overEvery, uniqBy } from 'lodash-es';
import { isAfter, sub } from 'date-fns';
import type { Status, StatusConfig } from '@tailor-cms/interfaces/activity';
import { useLocalStorage } from '@vueuse/core';

import Sidebar from '@/components/repository/Workflow/Sidebar/index.vue';
import { useCurrentRepository } from '@/stores/current-repository';
import WorkflowBoard from '@/components/repository/Workflow/Board/index.vue';
import WorkflowFilters from '@/components/repository/Workflow/Filters/index.vue';
import WorkflowList from '@/components/repository/Workflow/List/index.vue';
import WorkflowTable from '@/components/repository/Workflow/Table/index.vue';

const RECENCY_THRESHOLD = { days: 2 };
const SEARCH_LENGTH_THRESHOLD = 2;

interface Filters {
  search: string | null;
  status: string[];
  priority: string[];
  type: string[];
  assigneeIds: number[];
  recentOnly: boolean;
}

definePageMeta({ name: 'progress' });

const filters = reactive<Filters>({
  search: null,
  status: [],
  priority: [],
  type: [],
  assigneeIds: [],
  recentOnly: false,
});

const store = useCurrentRepository();
const {
  workflowActivities: activities,
  workflow,
  taxonomy,
} = storeToRefs(store);

const view = useLocalStorage<'board' | 'list' | 'table'>(
  'workflow:view',
  'board',
);

const filteredActivities = computed(() => {
  const { assigneeIds, search, status, priority, type, recentOnly } = filters;
  const searchFilterEnabled = search && search.length > SEARCH_LENGTH_THRESHOLD;

  const statusFilters = compact([
    status.length && filterByStatus,
    priority.length && filterByPriority,
    assigneeIds.length && filterByAssignee,
    recentOnly && filterByRecency,
  ]);

  return activities.value.filter(
    (activity) =>
      (!statusFilters.length || overEvery(statusFilters)(activity.currentStatus)) &&
      (!searchFilterEnabled || filterBySearch(activity)) &&
      (!type.length || type.includes(activity.type)),
  );
});

// Status filter on the board acts as column focus: it narrows which columns
// render rather than filtering cards out of an unchanged column set.
const visibleStatuses = computed<StatusConfig[]>(() => {
  const statuses = workflow.value?.statuses ?? [];
  if (!filters.status.length) return statuses;
  return statuses.filter((it: StatusConfig) => filters.status.includes(it.id));
});

// Activity types present among tracked activities, in taxonomy order (with
// their label/color). Drives the type filter, which is hidden below 2 types.
const types = computed(() => {
  const present = new Set(activities.value.map((it) => it.type));
  return (taxonomy.value ?? []).filter((it: any) => present.has(it.type));
});

const assignees = computed(() => {
  const uniqueAssignees = uniqBy(
    activities.value.map(({ currentStatus }) => currentStatus.assignee),
    'id',
  );
  return orderBy(uniqueAssignees, 'label');
});

const filterByStatus = ({ status }: Status) => filters.status.includes(status);

const filterByPriority = ({ priority }: Status) =>
  filters.priority.includes(priority);

const filterByAssignee = ({ assigneeId }: Status) => {
  return filters.assigneeIds.includes(assigneeId as number);
};

const filterByRecency = ({ updatedAt }: Status) => {
  const updatedAtLimit = sub(new Date(), RECENCY_THRESHOLD);
  return isAfter(new Date(updatedAt), updatedAtLimit);
};

const filterBySearch = ({ shortId, data, currentStatus }: StoreActivity) => {
  if (!filters.search) return;
  const searchableText = `${shortId} ${data.name} ${currentStatus.description}`;
  return searchableText.toLowerCase().includes(filters.search.toLowerCase());
};

onMounted(() => store.getUsers());
</script>

<style lang="scss" scoped>
// The page is a fixed pane: filters stay pinned and each view scrolls
// internally (board columns, list rows, table body).
.workflow {
  height: 100%;
  min-height: 0;
}
</style>

<template>
  <VLayout full-height>
    <VMain>
      <div class="workflow d-flex flex-column h-100">
        <WorkflowFilters
          v-model:assigneeIds="filters.assigneeIds"
          v-model:recentOnly="filters.recentOnly"
          v-model:search="filters.search"
          v-model:status="filters.status"
          :assignee-options="assignees"
          :status-options="workflow.statuses"
        />
        <WorkflowOverview :activities="filteredActivities" class="mt-5" />
      </div>
    </VMain>
    <Sidebar />
  </VLayout>
</template>

<script lang="ts" setup>
import { isAfter, sub } from 'date-fns';
import compact from 'lodash/compact';
import overEvery from 'lodash/overEvery';
import type { Status } from '@tailor-cms/interfaces/activity';
import uniqBy from 'lodash/uniqBy';

import Sidebar from '@/components/repository/Workflow/Sidebar/index.vue';
import { useCurrentRepository } from '@/stores/current-repository';
import WorkflowFilters from '@/components/repository/Workflow/Filters/index.vue';
import WorkflowOverview from '@/components/repository/Workflow/Overview/index.vue';

const RECENCY_THRESHOLD = { days: 2 };
const SEARCH_LENGTH_THRESHOLD = 2;

interface Filters {
  search: string | null;
  status: string | null;
  assigneeIds: number[];
  recentOnly: boolean;
}

definePageMeta({ name: 'progress' });

const filters = reactive<Filters>({
  search: null,
  status: null,
  assigneeIds: [],
  recentOnly: false,
});

const store = useCurrentRepository();
const { workflowActivities: activities, workflow } = storeToRefs(store);

const filteredActivities = computed(() => {
  const { assigneeIds, search, status, recentOnly } = filters;
  const searchFilterEnabled = search && search.length > SEARCH_LENGTH_THRESHOLD;

  const statusFilters = compact([
    status && filterByStatus,
    assigneeIds.length && filterByAssignee,
    recentOnly && filterByRecency,
  ]);

  return activities.value.filter(
    (activity) =>
      (!statusFilters.length || overEvery(statusFilters)(activity.status)) &&
      (!searchFilterEnabled || filterBySearch(activity)),
  );
});

const assignees = computed(() => {
  const unassigned = { id: null, label: 'Unassigned' };
  return uniqBy(
    activities.value.map(({ status }) => status.assignee ?? unassigned),
    'id',
  );
});

const filterByStatus = ({ status }: Status) => status === filters.status;

const filterByAssignee = ({ assigneeId }: Status) => {
  return filters.assigneeIds.includes(assigneeId as number);
};

const filterByRecency = ({ updatedAt }: Status) => {
  const updatedAtLimit = sub(new Date(), RECENCY_THRESHOLD);
  return isAfter(new Date(updatedAt), updatedAtLimit);
};

const filterBySearch = ({ shortId, data, status }: StoreActivity) => {
  if (!filters.search) return;
  const searchableText = `${shortId} ${data.name} ${status.description}`;
  return searchableText.toLowerCase().includes(filters.search.toLowerCase());
};

onMounted(() => store.getUsers());
</script>

<style lang="scss" scoped>
.workflow {
  padding: 2rem 5.625rem 2rem 3.75rem;
}
</style>

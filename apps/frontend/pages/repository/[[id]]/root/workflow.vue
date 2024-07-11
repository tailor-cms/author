<template>
  <VLayout full-height>
    <VMain>
      <div class="workflow">
        <WorkflowFilters
          v-model:assigneeIds="filters.assigneeIds"
          v-model:recentOnly="filters.recentOnly"
          v-model:search="filters.search"
          v-model:status="filters.status"
          v-model:unassigned="filters.unassigned"
          :assignee-options="assignees"
          :show-unassigned="unassignedActivityExists"
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
import { storeToRefs } from 'pinia';
import uniqBy from 'lodash/uniqBy';

import Sidebar from '@/components/repository/Workflow/Sidebar/index.vue';
import { useCurrentRepository } from '@/stores/current-repository';
import WorkflowFilters from '@/components/repository/Workflow/Filters/index.vue';
import WorkflowOverview from '@/components/repository/Workflow/Overview/index.vue';

const RECENCY_THRESHOLD = { days: 2 };
const SEARCH_LENGTH_THRESHOLD = 2;

definePageMeta({ name: 'progress' });

const filters = reactive({
  search: null,
  status: null,
  assigneeIds: [],
  unassigned: false,
  recentOnly: false,
});

const store = useCurrentRepository();
const { workflowActivities: activities, workflow } = storeToRefs(store);

const filteredActivities = computed(() => {
  const asigneeFilterEnabled = filters.assigneeIds.length || filters.unassigned;
  const searchFilterEnabled = filters.search?.length > SEARCH_LENGTH_THRESHOLD;

  const statusFilters = compact([
    filters.status && filterByStatus,
    asigneeFilterEnabled && filterByAssignee,
    filters.recentOnly && filterByRecency,
  ]);

  return activities.value.filter(
    (activity) =>
      (!statusFilters.length || overEvery(statusFilters)(activity.status)) &&
      (!searchFilterEnabled || filterBySearch(activity)),
  );
});

const unassignedActivityExists = computed(() =>
  activities.value.some((it) => !it.status.assigneeId),
);

const assignees = computed(() =>
  uniqBy(compact(activities.value.map(({ status }) => status.assignee)), 'id'),
);

const filterByStatus = ({ status }) => status === filters.status;

const filterByAssignee = ({ assigneeId }) => {
  if (filters.unassigned && !assigneeId) return true;
  return filters.assigneeIds.includes(assigneeId);
};

const filterByRecency = ({ updatedAt }) => {
  const updatedAtLimit = sub(new Date(), RECENCY_THRESHOLD);
  return isAfter(new Date(updatedAt), updatedAtLimit);
};

const filterBySearch = ({ shortId, data, status }) => {
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

<template>
  <VLayout class="workflow-page" full-height>
    <VMain>
      <VContainer class="workflow d-flex flex-column h-100" max-width="2000">
        <WorkflowFilters
          v-if="workflow"
          v-model:assignee-ids="filters.assigneeIds"
          v-model:recent-only="filters.recentOnly"
          v-model:search="filters.search"
          v-model:status="filters.status"
          :assignee-options="assignees"
          :status-options="workflow.statuses"
        />
        <WorkflowOverview :activities="filteredActivities" class="mt-5" />
      </VContainer>
    </VMain>
    <Sidebar />
  </VLayout>
</template>

<script lang="ts" setup>
import { compact, orderBy, overEvery, uniqBy } from 'lodash-es';
import { isAfter, sub } from 'date-fns';
import type { Status } from '@tailor-cms/interfaces/activity';

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
      (!statusFilters.length || overEvery(statusFilters)(activity.currentStatus)) &&
      (!searchFilterEnabled || filterBySearch(activity)),
  );
});

const assignees = computed(() => {
  const uniqueAssignees = uniqBy(
    activities.value.map(({ currentStatus }) => currentStatus.assignee),
    'id',
  );
  return orderBy(uniqueAssignees, 'label');
});

const filterByStatus = ({ status }: Status) => status === filters.status;

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

onMounted(async () => {
  await store.getUsers();
  const { activityId } = useRoute().query;
  if (activityId) store.selectActivity(parseInt(activityId as string, 10));
});
</script>

<style lang="scss" scoped>
.workflow {
  padding: 2rem 5.625rem 2rem 3.75rem;
}
</style>

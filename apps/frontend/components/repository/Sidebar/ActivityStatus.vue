<template>
  <VCard
    :to="{ name: 'progress', query: { activityId: id } }"
    class="d-flex align-center pa-2 ga-3"
    variant="tonal"
  >
    <VTooltip location="bottom" open-delay="500">
      <template #activator="{ props: tooltipProps }">
        <span
          v-bind="tooltipProps"
          class="d-flex align-center text-body-2 font-weight-bold"
        >
          <VIcon
            :color="statusConfig.color"
            icon="mdi-circle"
            size="small"
            start
          />
          {{ statusConfig.label.toUpperCase() }}
        </span>
      </template>
      Status
    </VTooltip>
    <UserAvatar
      :img-url="status.assignee?.imgUrl"
      :label="status.assignee?.label ?? 'Unassigned'"
      color="primary-lighten-4"
      size="x-small"
    />
    <VTooltip location="bottom" open-delay="500">
      <template #activator="{ props: tooltipProps }">
        <VIcon
          :color="priorityConfig.color"
          :icon="priorityConfig.icon"
          v-bind="tooltipProps"
          size="large"
        />
      </template>
      {{ priorityConfig.label }} priority
    </VTooltip>
    <VTooltip v-if="status.dueDate" location="bottom" open-delay="500">
      <template #activator="{ props: tooltipProps }">
        <DueDate
          v-bind="tooltipProps"
          :date="status.dueDate"
          class="text-caption font-weight-bold"
          format="MM/dd/yy"
        />
      </template>
      Due Date
    </VTooltip>
    <VSpacer />
    <VIcon class="mx-1" icon="mdi-arrow-right" size="small" />
  </VCard>
</template>

<script lang="ts" setup>
import type { Status } from '@tailor-cms/interfaces/activity';
import { UserAvatar } from '@tailor-cms/core-components-next';
import { workflow as workflowConfig } from 'tailor-config-shared';

import DueDate from '../Workflow/Overview/DueDate.vue';

const props = defineProps<{
  id: number | null;
  shortId: string;
  type: string;
  status: Status;
}>();

const repositoryStore = useCurrentRepository();

const statusConfig = computed(() =>
  repositoryStore.workflow.statuses.find(
    (s: any) => s.id === props.status.status,
  ),
);

const priorityConfig = computed(() =>
  workflowConfig.getPriority(props.status.priority),
);
</script>

<template>
  <VCard
    :to="{ name: 'progress', query: { activityId: id } }"
    class="d-flex align-center pa-2 ga-3"
    variant="tonal"
  >
    <VChip
      v-if="statusConfig"
      v-tooltip:bottom="{ text: 'Status', openDelay: 500 }"
      :text="statusConfig.label.toUpperCase()"
      class="font-weight-bold pl-2 pr-0"
      density="comfortable"
      variant="text"
    >
      <template #prepend>
        <VIcon :color="statusConfig.color" icon="mdi-circle" size="small" start />
      </template>
    </VChip>
    <UserAvatar
      :img-url="activityStatus.assignee?.imgUrl"
      :label="activityStatus.assignee?.label ?? 'Unassigned'"
      size="x-small"
    />
    <VIcon
      v-if="priorityConfig"
      v-tooltip:bottom="{ text: `${priorityConfig.label} priority`, openDelay: 500 }"
      :color="priorityConfig.color"
      :icon="priorityConfig.icon"
      size="large"
    />
    <DueDate
      v-if="activityStatus.dueDate"
      v-tooltip:bottom="{ text: 'Due Date', openDelay: 500 }"
      :date="activityStatus.dueDate"
      class="text-body-small font-weight-bold"
      format="MM/dd/yy"
    />
    <VSpacer />
    <VIcon class="mx-1" icon="mdi-arrow-right" size="small" />
  </VCard>
</template>

<script lang="ts" setup>
import type { Status } from '@tailor-cms/interfaces/activity';
import { UserAvatar } from '@tailor-cms/core-components';
import { workflow as workflowConfig } from '@tailor-cms/config';

import DueDate from '../Workflow/DueDate.vue';

const props = defineProps<{
  id: number | null;
  shortId: string;
  type: string;
  activityStatus: Status;
}>();

const store = useCurrentRepository();
const { workflow } = storeToRefs(store);

const statusConfig = computed(() =>
  workflow.value?.statuses.find(({ id }) => id === props.activityStatus.status),
);

const priorityConfig = computed(() =>
  workflowConfig.getPriority(props.activityStatus.priority),
);
</script>

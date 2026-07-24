<template>
  <div>
    <RichTextEditor
      :key="activity.id"
      :model-value="activityStatus.description"
      class="mb-2"
      data-testid="workflow_descriptionInput"
      label="Description"
      variant="outlined"
      @change="updateStatus('description', $event)"
    />
    <SelectStatus
      :items="workflow.statuses"
      :model-value="activityStatus.status"
      class="my-4"
      data-testid="workflow_statusInput"
      label="Status"
      variant="outlined"
      @update:model-value="updateStatus('status', $event)"
    />
    <SelectAssignee
      :items="users"
      :model-value="activityStatus.assigneeId"
      class="my-4"
      data-testid="workflow_assigneeInput"
      label="Assignee"
      placeholder="Click to set assignee"
      variant="outlined"
      clearable
      persistent-placeholder
      @update:model-value="updateStatus('assigneeId', $event)"
    />
    <SelectPriority
      :items="workflowConfig.priorities"
      :model-value="activityStatus.priority"
      class="my-4"
      data-testid="workflow_priorityInput"
      label="Priority"
      variant="outlined"
      @update:model-value="updateStatus('priority', $event)"
    />
    <VDateInput
      :model-value="dueDate && new Date(dueDate)"
      class="my-4"
      data-testid="workflow_dateInput"
      label="Due date"
      placeholder="Select due date"
      prepend-icon=""
      variant="outlined"
      clearable
      persistent-placeholder
      @click:clear="updateStatus('dueDate', null)"
      @update:model-value="updateStatus('dueDate', $event)"
    />
    <ActivityDiscussion
      :activity="activity"
      panel
      show-heading
    />
  </div>
</template>

<script lang="ts" setup>
import { RichTextEditor } from '@tailor-cms/core-components';
import { workflow as workflowConfig } from '@tailor-cms/config';

import ActivityDiscussion from '../../Discussion/index.vue';
import SelectAssignee from './SelectAssignee.vue';
import SelectPriority from './SelectPriority.vue';
import SelectStatus from './SelectStatus.vue';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activity: StoreActivity;
}>();

const notify = useNotification();
const activityStore = useActivityStore();
const { users, workflow } = storeToRefs(useCurrentRepository());

const activityStatus = computed(() => props.activity.currentStatus);
const dueDate = computed(
  () => activityStatus.value.dueDate && new Date(activityStatus.value.dueDate),
);

const updateStatus = async (key: string, value: any = null) => {
  await activityStore.saveStatus(props.activity.id, { [key]: value });
  return notify('Status saved');
};
</script>

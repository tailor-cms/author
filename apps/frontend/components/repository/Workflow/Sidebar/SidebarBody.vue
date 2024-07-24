<template>
  <div>
    <RichTextEditor
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
      data-testid="workflow_statusInput"
      label="Status"
      variant="outlined"
      @update:model-value="updateStatus('status', $event)"
    />
    <VSelect
      :items="users"
      :model-value="activityStatus.assigneeId"
      class="my-2"
      data-testid="workflow_assigneeInput"
      item-title="label"
      item-value="id"
      label="Assignee"
      placeholder="Click to set assignee"
      variant="outlined"
      clearable
      @update:model-value="updateStatus('assigneeId', $event)"
    >
      <template #selection="{ item }">
        <VAvatar :image="item.raw.imgUrl" class="mr-4" size="26" />
        {{ item.title }}
      </template>
      <template #item="{ item, props: selectProps }">
        <VListItem v-bind="selectProps">
          <template #prepend>
            <VAvatar :image="item.raw.imgUrl" size="26" />
          </template>
        </VListItem>
      </template>
    </VSelect>
    <SelectPriority
      :items="workflowConfig.priorities"
      :model-value="activityStatus.priority"
      class="mb-2"
      data-testid="workflow_priorityInput"
      label="Priority"
      variant="outlined"
      @update:model-value="updateStatus('priority', $event)"
    />
    <VDateInput
      :model-value="dueDate && new Date(dueDate)"
      data-testid="workflow_dateInput"
      label="Due date"
      prepend-icon=""
      variant="outlined"
      clearable
      @click:clear="updateStatus('dueDate', null)"
      @update:model-value="updateStatus('dueDate', $event)"
    />
  </div>
</template>

<script lang="ts" setup>
import { RichTextEditor } from '@tailor-cms/core-components-next';
import { VDateInput } from 'vuetify/labs/VDateInput';
import { workflow as workflowConfig } from 'tailor-config-shared';

import SelectPriority from '../SelectPriority.vue';
import SelectStatus from '../SelectStatus.vue';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{
  activity: StoreActivity;
}>();

const notify = useNotification();
const activityStore = useActivityStore();
const { users, workflow } = storeToRefs(useCurrentRepository());

const activityStatus = computed(() => props.activity.status);
const dueDate = computed(
  () => activityStatus.value.dueDate && new Date(activityStatus.value.dueDate),
);

const updateStatus = async (key: string, value: any = null) => {
  const updatedData = { ...activityStatus.value, [key]: value } as any;
  await activityStore.saveStatus(props.activity.id, updatedData);
  return notify('Status saved', { immediate: true });
};
</script>

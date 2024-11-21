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
    <VSelect
      :items="users"
      :model-value="activityStatus.assigneeId"
      class="my-4"
      data-testid="workflow_assigneeInput"
      item-title="label"
      item-value="id"
      label="Assignee"
      placeholder="Click to set assignee"
      variant="outlined"
      clearable
      persistent-placeholder
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
  </div>
</template>

<script lang="ts" setup>
import { RichTextEditor } from '@tailor-cms/core-components';
import type { Status } from '@tailor-cms/interfaces/activity';
import { VDateInput } from 'vuetify/labs/VDateInput';
import { workflow as workflowConfig } from '@tailor-cms/config';

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

const activityStatus = computed(
  () => props.activity.status as unknown as Status,
);
const dueDate = computed(
  () => activityStatus.value.dueDate && new Date(activityStatus.value.dueDate),
);

const updateStatus = async (key: string, value: any = null) => {
  const updatedData = { ...activityStatus.value, [key]: value } as any;
  await activityStore.saveStatus(props.activity.id, updatedData);
  return notify('Status saved', { immediate: true });
};
</script>

<style lang="scss" scoped>
:deep(.v-input) {
  $error-color: rgb(var(--v-theme-secondary-lighten-4));

  .v-messages__message,
  .v-field__outline,
  .v-field-label,
  input::placeholder,
  textarea::placeholder {
    color: rgb(var(--v-theme-primary-lighten-5));
    opacity: 1;
  }

  &.v-input--error {
    .v-messages__message,
    .v-field__outline,
    .v-field-label,
    input::placeholder,
    textarea::placeholder {
      color: $error-color;
    }
  }
}

.v-select :deep(.v-select__menu-icon) {
  color: rgb(var(--v-theme-primary-lighten-5)) !important;
  opacity: 1;
}
</style>

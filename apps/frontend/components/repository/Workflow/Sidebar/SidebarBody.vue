<template>
  <section>
    <RichTextEditor
      :model-value="status.description"
      class="mb-2"
      label="Description"
      variant="outlined"
      @change="updateStatus('description', $event)"
    />
    <SelectStatus
      :items="workflow.statuses"
      :model-value="status.status"
      label="Status"
      variant="outlined"
      @update:model-value="updateStatus('status', $event)"
    />
    <VSelect
      :items="users"
      :model-value="status.assigneeId"
      class="my-2"
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
      :model-value="status.priority"
      class="mb-2"
      label="Priority"
      variant="outlined"
      @update:model-value="updateStatus('priority', $event)"
    />
    <VDateInput
      :model-value="dueDate && new Date(dueDate)"
      label="Due date"
      prepend-icon=""
      variant="outlined"
      clearable
      @click:clear="updateStatus('dueDate', null)"
      @update:model-value="updateStatus('dueDate', $event)"
    />
  </section>
</template>

<script lang="ts" setup>
import { RichTextEditor } from '@tailor-cms/core-components-next';
import type { Status } from '@tailor-cms/interfaces/activity';
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

const status = computed(() => props.activity.status as unknown as Status);
const dueDate = computed(
  () => status.value.dueDate && new Date(status.value.dueDate),
);

const updateStatus = async (key: string, value: any = null) => {
  const updatedData = { ...status.value, [key]: value } as any;
  await activityStore.saveStatus(props.activity.id, updatedData);
  return notify('Status saved', { immediate: true });
};
</script>

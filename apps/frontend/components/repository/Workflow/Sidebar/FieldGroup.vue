<template>
  <section>
    <RichTextEditor
      :model-value="description"
      class="mb-2"
      label="Description"
      variant="outlined"
      @update:model-value="update('description', $event)"
    />
    <SelectStatus
      :items="workflow.statuses"
      :model-value="status"
      label="Status"
      variant="outlined"
      @update:model-value="update('status', $event)"
    />
    <VSelect
      :items="users"
      :model-value="assigneeId"
      class="my-2"
      item-title="label"
      item-value="id"
      label="Assignee"
      placeholder="Click to set assignee"
      variant="outlined"
      clearable
      @update:model-value="update('assigneeId', $event)"
    >
      <template #selection="{ item }">
        <VAvatar :image="item.raw.imgUrl" class="mr-3" size="26" />
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
      :model-value="priority"
      class="mb-2"
      @update:model-value="update('priority', $event)"
    />
    <VDateInput
      :model-value="dueDate && new Date(dueDate)"
      label="Due date"
      prepend-icon=""
      variant="outlined"
      clearable
      @click:clear="update('dueDate', null)"
      @update:model-value="update('dueDate', $event)"
    />
  </section>
</template>

<script lang="ts" setup>
import { RichTextEditor } from '@tailor-cms/core-components-next';
import { VDateInput } from 'vuetify/labs/VDateInput';
import { workflow as workflowConfig } from 'tailor-config-shared';

import SelectPriority from '../SelectPriority.vue';
import SelectStatus from '../SelectStatus.vue';
import { useCurrentRepository } from '@/stores/current-repository';

type Key = 'description' | 'status' | 'assigneeId' | 'priority' | 'dueDate';

interface Props {
  description?: string | null;
  status?: string | null;
  assigneeId?: number | null;
  priority?: string | null;
  dueDate?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  description: null,
  status: null,
  assigneeId: null,
  priority: workflowConfig.priorities.find((it) => it.default)?.id ?? null,
  dueDate: null,
});
const emit = defineEmits(['update']);

const { users, workflow } = storeToRefs(useCurrentRepository());
const update = async (key: Key, value: any) => {
  if (props[key] === value) return;
  emit('update', key, value);
};
</script>

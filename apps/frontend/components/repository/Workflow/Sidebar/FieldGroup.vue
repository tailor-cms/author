<template>
  <section>
    <RichTextEditor
      v-model="description"
      class="mb-2"
      label="Description"
      variant="outlined"
    />
    <SelectStatus
      v-model="status"
      :items="workflow.statuses"
      label="Status"
      variant="outlined"
    />
    <VSelect
      v-model="assigneeId"
      :items="users"
      class="my-2"
      item-title="label"
      item-value="id"
      label="Assignee"
      placeholder="Click to set assignee"
      variant="outlined"
      clearable
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
      v-model="priority"
      :items="workflowConfig.priorities"
      class="mb-2"
    />
    <VDateInput
      :model-value="dueDate && new Date(dueDate)"
      label="Due date"
      prepend-icon=""
      variant="outlined"
      clearable
      @click:clear="dueDate = null"
      @update:model-value="dueDate = $event"
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

const description = defineModel<string | null>('description', {
  default: null,
});
const status = defineModel<string | null>('status', { default: null });
const assigneeId = defineModel<number | null>('assigneeId', { default: null });
const priority = defineModel<string | null>('priority', { default: null });
const dueDate = defineModel<string | null>('dueDate', { default: null });

const { users, workflow } = storeToRefs(useCurrentRepository());
</script>

<template>
  <div class="toolbar d-flex align-center flex-wrap ga-4 mb-4">
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <VTextField
        v-model="search"
        v-bind="hoverProps"
        :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
        density="comfortable"
        max-width="280"
        min-width="232"
        name="Search"
        placeholder="Search by name or id..."
        prepend-inner-icon="mdi-magnify"
        rounded="xl"
        variant="solo"
        clearable
        flat
        hide-details
      />
    </VHover>
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <SelectStatus
        v-bind="hoverProps"
        v-model="status"
        :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
        :items="statusOptions"
        data-testid="workflow_statusFilter"
        density="comfortable"
        max-width="280"
        min-width="232"
        placeholder="Filter by status"
        rounded="xl"
        variant="solo"
        clearable
        flat
        hide-details
      />
    </VHover>
    <AssigneeFilter
      v-if="assigneeOptions"
      v-model="assigneeIds"
      :options="assigneeOptions"
      data-testid="workflow_assigneeFilter"
    />
    <VBtn
      :active="recentOnly"
      :color="recentOnly ? 'secondary-lighten-4' : 'primary-lighten-3'"
      variant="tonal"
      @click="recentOnly = !recentOnly"
    >
      Recently updated
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
import type { User } from '@tailor-cms/interfaces/user';

import SelectStatus from '../SelectStatus.vue';
import AssigneeFilter from './Assignee.vue';

defineProps<{
  assigneeOptions: Array<User | null>;
  statusOptions: any[];
}>();

const search = defineModel<string | null>('search', { default: null });
const recentOnly = defineModel<boolean>('recentOnly', { default: false });
const status = defineModel<string | null>('status', { default: null });
const assigneeIds = defineModel<number[]>('assigneeIds', { default: () => [] });
</script>

<style lang="scss" scoped>
:deep(input::placeholder) {
  opacity: 0.75;
}
</style>

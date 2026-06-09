<template>
  <div class="toolbar d-flex align-center flex-wrap ga-3">
    <VHover v-slot="{ props: hoverProps }">
      <VTextField
        v-model="search"
        v-bind="hoverProps"
        bg-color="transparent"
        density="comfortable"
        max-width="280"
        min-width="232"
        name="Search"
        placeholder="Search by name or id..."
        prepend-inner-icon="mdi-magnify"
        rounded="xl"
        variant="solo-filled"
        clearable
        flat
        hide-details
      />
    </VHover>
    <VHover v-slot="{ props: hoverProps }">
      <SelectStatus
        v-bind="hoverProps"
        v-model="status"
        :items="statusOptions"
        bg-color="transparent"
        data-testid="workflow_statusFilter"
        density="comfortable"
        max-width="230"
        min-width="200"
        placeholder="Filter by status"
        rounded="pill"
        variant="solo-filled"
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
    <VChip
      :color="recentOnly ? 'tertiary' : ''"
      :prepend-icon="recentOnly ? 'mdi-check-circle' : 'mdi-circle-outline'"
      rounded="lg"
      text="Show only recent"
      variant="tonal"
      @click="recentOnly = !recentOnly"
    />
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

<template>
  <div class="toolbar d-flex align-center flex-wrap ga-4">
    <VHover v-slot="{ props: hoverProps }">
      <VTextField
        v-model="search"
        v-bind="hoverProps"
        bg-color="transparent"
        density="compact"
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
    <VSpacer />
    <VHover v-slot="{ props: hoverProps }">
      <SelectStatus
        v-bind="hoverProps"
        v-model="status"
        :items="statusOptions"
        data-testid="workflow_statusFilter"
        bg-color="primary-darken-2"
        density="compact"
        max-width="220"
        min-width="200"
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
    <VChip
      :color="recentOnly ? 'lime-accent-3' : 'primary-lighten-4'"
      :prepend-icon="recentOnly ? 'mdi-check' : undefined"
      variant="tonal"
      rounded="lg"
      @click="recentOnly = !recentOnly"
    >
      Show only recent
    </VChip>
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

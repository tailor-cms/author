<template>
  <VToolbar class="toolbar" color="transparent">
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <VTextField
        v-model="search"
        v-bind="hoverProps"
        :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
        class="mr-4"
        density="comfortable"
        max-width="280"
        min-width="232"
        name="Search"
        placeholder="Search by ID or name"
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
        class="mr-4"
        density="comfortable"
        max-width="232"
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
      :options="assigneeOptions"
      :selected="assigneeIds"
      :show-unassigned="showUnassigned"
      :unassigned="unassigned"
      class="mr-4"
      @change:assignee="assigneeIds = $event"
      @change:unassigned="unassigned = $event"
    />
    <VBtn
      :active="recentOnly"
      color="secondary-lighten-4"
      height="42"
      variant="tonal"
      @click="recentOnly = !recentOnly"
    >
      Recently updated
    </VBtn>
  </VToolbar>
</template>

<script lang="ts" setup>
import AssigneeFilter from './Assignee.vue';
import SelectStatus from '../SelectStatus.vue';

interface Props {
  assigneeOptions?: Record<string, any>;
  statusOptions?: any[];
  showUnassigned?: boolean;
}

withDefaults(defineProps<Props>(), {
  assigneeOptions: () => ({}),
  statusOptions: () => [],
  showUnassigned: false,
});

const search = defineModel<string | null>('search', { default: null });
const recentOnly = defineModel<boolean>('recentOnly', { default: false });
const status = defineModel<string | null>('status', { default: null });
const assigneeIds = defineModel<number[]>('assigneeIds', { default: () => [] });
const unassigned = defineModel<boolean>('unassigned', { default: false });
</script>

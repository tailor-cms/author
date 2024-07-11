<template>
  <VToolbar class="toolbar" color="transparent">
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <VTextField
        v-bind="hoverProps"
        :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
        :model-value="search"
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
        @update:model-value="updateFilter('search', $event)"
      />
    </VHover>
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <SelectStatus
        v-bind="hoverProps"
        :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
        :items="statusOptions"
        :model-value="status"
        class="mr-4"
        density="comfortable"
        max-width="232"
        placeholder="Filter by status"
        rounded="xl"
        variant="solo"
        clearable
        flat
        hide-details
        @update:model-value="updateFilter('status', $event)"
      />
    </VHover>
    <AssigneeFilter
      v-if="assigneeOptions"
      :options="assigneeOptions"
      :selected="assigneeIds"
      :show-unassigned="showUnassigned"
      :unassigned="unassigned"
      class="mr-4"
      @change:assignee="updateFilter('assigneeIds', $event)"
      @change:unassigned="updateFilter('unassigned', $event)"
    />
    <VBtn
      :active="recentOnly"
      color="secondary-lighten-4"
      height="42"
      variant="tonal"
      @click="updateFilter('recentOnly', !recentOnly)"
    >
      Recently updated
    </VBtn>
  </VToolbar>
</template>

<script lang="ts" setup>
import AssigneeFilter from './Assignee.vue';
import SelectStatus from '../SelectStatus.vue';

interface Props {
  search?: string | null;
  recentOnly?: boolean;
  status?: string | null;
  assigneeIds?: any[];
  unassigned?: boolean;
  assigneeOptions?: Record<string, any>;
  statusOptions?: any[];
  showUnassigned?: boolean;
}

withDefaults(defineProps<Props>(), {
  search: null,
  recentOnly: false,
  status: null,
  assigneeIds: () => [],
  unassigned: false,
  assigneeOptions: () => ({}),
  statusOptions: () => [],
  showUnassigned: false,
});

const emit = defineEmits([
  'update:search',
  'update:recentOnly',
  'update:status',
  'update:assigneeIds',
  'update:unassigned',
]);

const updateFilter = (filter: string, value: any) => {
  emit(`update:${filter}`, value);
};
</script>

<style lang="scss" scoped>
.btn-filters {
  letter-spacing: inherit;
}
</style>

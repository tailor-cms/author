<template>
  <div class="toolbar d-flex align-center flex-wrap ga-3">
    <VHover v-slot="{ props: hoverProps }">
      <VTextField
        v-model="search"
        v-bind="hoverProps"
        bg-color="surface-container"
        density="comfortable"
        max-width="384"
        min-width="220"
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
    <SelectChip
      v-model="status"
      :items="statusOptions"
      data-testid="workflow_statusFilter"
      label="Status"
    />
    <SelectChip
      v-if="typeItems.length > 1"
      v-model="type"
      :items="typeItems"
      data-testid="workflow_typeFilter"
      label="Type"
    />
    <VChip
      :color="recentOnly ? 'tertiary' : ''"
      :prepend-icon="recentOnly ? 'mdi-check-circle' : 'mdi-circle-outline'"
      rounded="lg"
      text="Recent"
      variant="tonal"
      @click="recentOnly = !recentOnly"
    />
    <AssigneeFilter
      v-if="assigneeOptions"
      v-model="assigneeIds"
      :options="assigneeOptions"
      class="ml-1"
      data-testid="workflow_assigneeFilter"
    />
  </div>
</template>

<script lang="ts" setup>
import type { UserSummary } from '@tailor-cms/interfaces/user';

import AssigneeFilter from './Assignee.vue';
import SelectChip from './SelectChip.vue';

const props = withDefaults(
  defineProps<{
    assigneeOptions: Array<UserSummary | null>;
    statusOptions: any[];
    typeOptions?: any[];
  }>(),
  { typeOptions: () => [] },
);

const search = defineModel<string | null>('search', { default: null });
const recentOnly = defineModel<boolean>('recentOnly', { default: false });
const status = defineModel<string[]>('status', { default: () => [] });
const type = defineModel<string[]>('type', { default: () => [] });
const assigneeIds = defineModel<number[]>('assigneeIds', { default: () => [] });

// Taxonomy entries keyed for the generic select chip.
const typeItems = computed(() =>
  props.typeOptions.map((it: any) => ({
    id: it.type,
    label: it.label,
    color: it.color,
  })),
);
</script>

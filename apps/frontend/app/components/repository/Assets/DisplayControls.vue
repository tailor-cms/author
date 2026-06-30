<template>
  <div class="d-flex align-center ga-2 mb-4">
    <VSpacer />
    <VMenu>
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          :text="`${itemsPerPage} per page`"
          append-icon="mdi-chevron-down"
          size="small"
          variant="text"
        />
      </template>
      <VList density="compact" nav>
        <VListItem
          v-for="size in PAGE_SIZE_OPTIONS"
          :key="size"
          :active="itemsPerPage === size"
          :title="`${size} per page`"
          @click="itemsPerPage = size"
        />
      </VList>
    </VMenu>
    <VBtn
      :append-icon="`mdi-sort-${sortDirection === 'DESC' ? 'descending' : 'ascending'}`"
      :text="sortDirection === 'DESC' ? 'Newest first' : 'Oldest first'"
      size="small"
      variant="text"
      @click="$emit('toggle-sort')"
    />
    <VBtnToggle
      v-model="viewMode"
      color="secondary"
      variant="outlined"
      density="compact"
      mandatory
    >
      <VBtn class="pl-5 pr-4" icon="mdi-view-module" value="grid" size="small" />
      <VBtn class="pl-4 pr-5" icon="mdi-view-list" value="list" size="small" />
    </VBtnToggle>
  </div>
</template>

<script lang="ts" setup>
import { PAGE_SIZE_OPTIONS } from '@/composables/useAssets';

defineProps<{
  sortDirection: 'ASC' | 'DESC';
}>();

const itemsPerPage = defineModel<number>('itemsPerPage', {
  required: true,
});
const viewMode = defineModel<'grid' | 'list'>('viewMode', {
  required: true,
});

defineEmits<{
  'toggle-sort': [];
}>();
</script>

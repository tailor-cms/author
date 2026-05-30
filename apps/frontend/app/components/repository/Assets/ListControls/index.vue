<template>
  <div class="d-flex align-center flex-wrap ga-2 mb-4">
    <CategoryFilter v-model="selectedCategory" :categories="categories" />
    <VSpacer />
    <VBtn
      :text="isAllSelected ? 'Deselect all' : 'Select all'"
      size="small"
      variant="text"
      @click="$emit('toggle-all', !isAllSelected)"
    />
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
      <VList density="compact">
        <VListItem
          v-for="size in PAGE_SIZE_OPTIONS"
          :key="size"
          :active="itemsPerPage === size"
          :text="`${size} per page`"
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
  </div>
</template>

<script lang="ts" setup>
import CategoryFilter from './CategoryFilter.vue';
import { PAGE_SIZE_OPTIONS } from '@/composables/useAssets';

const props = defineProps<{
  categories: { label: string; value: string }[];
  isAllSelected: boolean;
  sortDirection: 'ASC' | 'DESC';
}>();

const selectedCategory = defineModel<string>('selectedCategory', {
  required: true,
});
const itemsPerPage = defineModel<number>('itemsPerPage', {
  required: true,
});

defineEmits<{
  'toggle-all': [selected: boolean];
  'toggle-sort': [];
}>();
</script>

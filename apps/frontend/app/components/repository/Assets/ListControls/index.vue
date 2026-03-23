<template>
  <div class="d-flex align-center flex-wrap ga-2 mb-4">
    <CategoryFilter v-model="selectedCategory" :categories="categories" />
    <VSpacer />
    <VBtn
      color="primary-lighten-4"
      size="small"
      variant="text"
      @click="isAllSelected ? $emit('deselect-all') : $emit('select-all')"
    >
      {{ isAllSelected ? 'Deselect all' : 'Select all' }}
    </VBtn>
    <VMenu>
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          append-icon="mdi-chevron-down"
          color="primary-lighten-4"
          size="small"
          variant="text"
        >
          {{ itemsPerPage }} per page
        </VBtn>
      </template>
      <VList density="compact">
        <VListItem
          v-for="size in PAGE_SIZE_OPTIONS"
          :key="size"
          :active="itemsPerPage === size"
          @click="itemsPerPage = size"
        >
          {{ size }} per page
        </VListItem>
      </VList>
    </VMenu>
    <VBtn
      :append-icon="
        sortDirection === 'DESC'
          ? 'mdi-sort-descending'
          : 'mdi-sort-ascending'
      "
      color="primary-lighten-4"
      size="small"
      variant="text"
      @click="$emit('toggle-sort')"
    >
      {{ sortDirection === 'DESC' ? 'Newest first' : 'Oldest first' }}
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
import CategoryFilter from './CategoryFilter.vue';
import { PAGE_SIZE_OPTIONS } from '@/composables/useAssets';

defineProps<{
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
  'select-all': [];
  'deselect-all': [];
  'toggle-sort': [];
}>();
</script>

<template>
  <div class="d-flex align-center flex-wrap ga-2 mb-4">
    <ViewToggle v-model="viewMode" />
    <VDivider vertical class="ma-2" />
    <CategoryFilter v-model="selectedCategory" :categories="categories" />
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
  </div>
</template>

<script lang="ts" setup>
import type { AssetViewMode } from '@/composables/useAssetFolders';
import CategoryFilter from './CategoryFilter.vue';
import ViewToggle from './ViewToggle.vue';
import { PAGE_SIZE_OPTIONS } from '@/composables/useAssets';

defineProps<{
  categories: { label: string; value: string }[];
  sortDirection: 'ASC' | 'DESC';
}>();

const selectedCategory = defineModel<string>('selectedCategory', {
  required: true,
});
const itemsPerPage = defineModel<number>('itemsPerPage', {
  required: true,
});
const viewMode = defineModel<AssetViewMode>('viewMode', {
  required: true,
});

defineEmits<{
  'toggle-sort': [];
}>();
</script>

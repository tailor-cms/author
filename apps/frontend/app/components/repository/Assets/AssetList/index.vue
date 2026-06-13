<template>
  <div v-if="isFetching && !assets.length" class="d-flex justify-center py-16">
    <VProgressCircular indeterminate />
  </div>
  <VDataIterator
    v-else-if="assets.length"
    :class="{ 'opacity-50': isFetching }"
    :items="assets"
    :items-length="total"
    :items-per-page="props.itemsPerPage"
    :page="props.page"
  >
    <template #default="{ items }">
      <div class="d-flex flex-column">
        <AssetRow
          v-for="{ raw: asset } in items"
          :key="asset.id"
          :asset="asset"
          :is-active="asset.id === activeAssetId"
          :is-selected="selectedIds.has(asset.id)"
          @preview="emit('preview', $event)"
          @toggle="emit('select:toggle', $event)"
          @download="emit('download', $event)"
          @index="emit('index', $event)"
          @deindex="emit('deindex', $event)"
          @delete="emit('delete', $event)"
        />
      </div>
    </template>
    <template #footer>
      <VPagination
        v-if="pageCount > 1"
        :model-value="props.page"
        :length="pageCount"
        class="mt-4"
        :total-visible="7"
        density="comfortable"
        rounded
        @update:model-value="emit('update:page', $event)"
      />
    </template>
  </VDataIterator>
  <VEmptyState
    v-if="!assets.length && !isFetching"
    class="py-16 empty-state rounded-lg"
    bg-color="surface-container"
    icon="mdi-image-multiple"
    :text="emptyStateText"
    :title="emptyStateTitle"
  />
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';

import { CATEGORY_ALL } from '~/composables/useAssetFiltering';
import AssetRow from './AssetRow.vue';

const props = defineProps<{
  isFetching: boolean;
  assets: Asset[];
  total: number;
  page: number;
  pageCount: number;
  itemsPerPage: number;
  selectedIds: Set<number>;
  selectedCategory: string;
  search: string;
  activeAssetId: number | null;
}>();

const emit = defineEmits<{
  'update:page': [page: number];
  'preview': [asset: Asset];
  'select:toggle': [asset: Asset];
  'download': [asset: Asset];
  'index': [asset: Asset];
  'deindex': [asset: Asset];
  'delete': [asset: Asset];
}>();

const isFiltered = computed(
  () => props.selectedCategory !== CATEGORY_ALL || Boolean(props.search.trim()),
);
const emptyStateTitle = computed(() => isFiltered.value
  ? 'No assets match your search or filter.'
  : 'No assets uploaded yet.',
);
const emptyStateText = computed(() => isFiltered.value
  ? 'Try adjusting your search or filters.'
  : 'Upload files, add links, or use Discover.',
);
</script>

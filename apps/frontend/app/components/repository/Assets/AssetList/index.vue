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
      <AssetRow
        v-for="{ raw: asset } in items"
        :key="asset.id"
        :asset="asset"
        :is-selected="selectedIds.has(asset.id)"
        @preview="emit('preview', $event)"
        @toggle="emit('select:toggle', $event)"
        @download="emit('download', $event)"
        @index="emit('index', $event)"
        @delete="emit('delete', $event)"
      />
    </template>
    <template #footer>
      <VPagination
        v-if="pageCount > 1"
        :model-value="props.page"
        :length="pageCount"
        :total-visible="7"
        density="comfortable"
        rounded
        @update:model-value="emit('update:page', $event)"
      />
    </template>
  </VDataIterator>
  <VEmptyState
    v-if="!assets.length && !isFetching"
    class="py-16 empty-state"
    icon="mdi-folder-multiple-image"
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
}>();

const emit = defineEmits<{
  'update:page': [page: number];
  'preview': [asset: Asset];
  'select:toggle': [asset: Asset];
  'download': [asset: Asset];
  'index': [asset: Asset];
  'delete': [asset: Asset];
}>();

const isFiltered = computed(
  () => props.selectedCategory !== CATEGORY_ALL || Boolean(props.search.trim()),
);
const emptyStateTitle = computed(() => isFiltered.value
  ? 'No assets match your search or filter.'
  : 'No assets uploaded yet.',
);
const emptyStateText = computed(() =>
  isFiltered.value ? undefined : 'Upload files, add links, or use Discover.',
);
</script>

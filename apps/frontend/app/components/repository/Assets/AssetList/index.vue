<template>
  <div v-if="isFetching && !assets.length" class="d-flex justify-center py-16">
    <VProgressCircular color="primary-lighten-3" indeterminate />
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
        @select="emit('select', $event)"
        @toggle="emit('select:toggle', $event)"
        @download="emit('download', $event)"
        @delete="emit('delete', $event)"
      />
    </template>
    <template #footer>
      <div v-if="pageCount > 1" class="d-flex align-center justify-center pa-4">
        <VPagination
          :model-value="props.page"
          :length="pageCount"
          :total-visible="7"
          active-color="primary-lighten-4"
          color="primary-lighten-3"
          density="comfortable"
          rounded
          @update:model-value="emit('update:page', $event)"
        />
      </div>
    </template>
  </VDataIterator>
  <div
    v-if="!assets.length && !isFetching"
    class="empty-state d-flex flex-column align-center py-16"
  >
    <VIcon color="primary-lighten-2" icon="mdi-folder-open-outline" size="64" />
    <div class="mt-4 text-body-1 text-primary-lighten-3">
      {{
        selectedCategory !== 'all'
          ? 'No assets match the selected filter.'
          : 'No assets uploaded yet.'
      }}
    </div>
    <div
      v-if="selectedCategory === 'all'"
      class="text-caption text-primary-lighten-2 mt-1"
    >
      Upload files, add links, or use Discover.
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';

import AssetRow from './AssetRow.vue';

const props = defineProps<{
  isFetching: boolean;
  assets: Asset[];
  total: number;
  page: number;
  itemsPerPage: number;
  selectedIds: Set<number>;
  selectedCategory: string;
}>();

const pageCount = computed(() => Math.ceil(props.total / props.itemsPerPage));

const emit = defineEmits<{
  'update:page': [page: number];
  'select': [asset: Asset];
  'select:toggle': [asset: Asset];
  'download': [asset: Asset];
  'delete': [asset: Asset];
}>();
</script>

<template>
  <div v-if="showLoading" class="d-flex justify-center py-16">
    <VProgressCircular indeterminate />
  </div>
  <VDataIterator
    v-else-if="assets.length"
    ref="iteratorEl"
    :class="{ 'opacity-50': isFetching }"
    :items="assets"
    :items-length="total"
    :items-per-page="props.itemsPerPage"
    :page="props.page"
  >
    <template #default="{ items }">
      <div v-if="viewMode === 'grid'" class="asset-grid">
        <AssetTile
          v-for="{ raw: asset } in items"
          :key="asset.id"
          :asset="asset"
          :is-active="asset.id === activeAssetId"
          :is-selected="selected.has(asset.id)"
          :is-selection-active="hasSelection"
          :show-folder="isFiltered"
          @preview="emit('preview', $event)"
          @toggle="emit('select:toggle', $event)"
          @download="emit('download', $event)"
          @index="emit('index', $event)"
          @deindex="emit('deindex', $event)"
          @move="emit('move', $event)"
          @delete="emit('delete', $event)"
          @open-folder="emit('folder:open', $event)"
        />
      </div>
      <VList
        v-else
        class="d-flex bg-transparent flex-column ga-2 overflow-visible"
      >
        <AssetRow
          v-for="{ raw: asset } in items"
          :key="asset.id"
          :asset="asset"
          :compact="compact"
          :is-active="asset.id === activeAssetId"
          :is-selected="selected.has(asset.id)"
          :is-selection-active="hasSelection"
          :show-folder="isFiltered"
          @preview="emit('preview', $event)"
          @toggle="emit('select:toggle', $event)"
          @download="emit('download', $event)"
          @index="emit('index', $event)"
          @deindex="emit('deindex', $event)"
          @move="emit('move', $event)"
          @delete="emit('delete', $event)"
          @open-folder="emit('folder:open', $event)"
        />
      </VList>
    </template>
    <template #footer>
      <VPagination
        v-if="pageCount > 1"
        :model-value="props.page"
        :length="pageCount"
        :total-visible="7"
        class="mt-4"
        density="comfortable"
        rounded
        @update:model-value="emit('update:page', $event)"
      />
    </template>
  </VDataIterator>
  <TailorEmptyState
    v-else-if="showEmptyState"
    :action-text="emptyState.actionText"
    :icon="emptyState.icon"
    :prepend-action-icon="emptyState.prependActionIcon"
    :text="emptyState.text"
    :title="emptyState.title"
    class="empty-state"
    data-testid="assetEmptyState"
    @click:action="emptyState.handler?.()"
  />
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';
import { CATEGORY_ALL } from '~/composables/useAssetFiltering';
import { oneLine } from 'common-tags';
import { useElementSize } from '@vueuse/core';
import AssetRow from './AssetRow.vue';
import AssetTile from './AssetTile.vue';
import { TailorEmptyState } from '@tailor-cms/core-components';

const props = defineProps<{
  isFetching: boolean;
  foldersLoaded: boolean;
  assets: Asset[];
  total: number;
  page: number;
  pageCount: number;
  itemsPerPage: number;
  selected: Map<number, Asset>;
  selectedCategory: string;
  search: string;
  activeAssetId: number | null;
  hasFolders: boolean;
  currentFolder: string;
  isLocalFolder: boolean;
  viewMode: 'grid' | 'list';
}>();

const emit = defineEmits<{
  'update:page': [page: number];
  'preview': [asset: Asset];
  'select:toggle': [asset: Asset];
  'download': [asset: Asset];
  'index': [asset: Asset];
  'deindex': [asset: Asset];
  'move': [asset: Asset];
  'delete': [asset: Asset];
  'folder:open': [path: string];
  'folder:up': [];
  'clear:filters': [];
}>();

// Collapse the row meta (type + size) when the list gets narrow, so the name +
// date stay readable instead of truncating. Measured once here and passed down,
// rather than a ResizeObserver per row.
const iteratorEl = ref(null);
const { width: listWidth } = useElementSize(iteratorEl);
const compact = computed(() => listWidth.value > 0 && listWidth.value < 460);

const isFiltered = computed(
  () => props.selectedCategory !== CATEGORY_ALL || Boolean(props.search.trim()),
);

const hasSelection = computed(() => props.selected.size > 0);

const showLoading = computed(
  () => !props.assets.length && (props.isFetching || !props.foldersLoaded),
);

const showEmptyState = computed(
  () =>
    props.foldersLoaded &&
    !props.isFetching &&
    !props.assets.length &&
    !props.hasFolders,
);

const emptyState = computed(() => {
  const isInFolder = !!props.currentFolder && !isFiltered.value;
  if (isFiltered.value) return {
    icon: 'mdi-image-multiple',
    title: 'No matches',
    text: 'No assets match your search or filters.',
    actionText: 'Clear filters',
    prependActionIcon: 'mdi-close',
    handler: () => emit('clear:filters'),
  };
  if (isInFolder) {
    const text = props.isLocalFolder
      ? oneLine`
          This folder is saved on your device until you add a file to it.
          Upload or move an asset here to keep it for everyone.
        `
      : 'Upload files here or move assets in.';
    return {
      icon: 'mdi-folder-open-outline',
      title: 'This folder is empty.',
      text,
      actionText: 'Go back',
      prependActionIcon: 'mdi-arrow-left',
      event: () => emit('folder:up'),
    };
  }
  return {
    icon: 'mdi-image-multiple',
    title: 'No assets uploaded yet.',
    text: 'Upload files, add links, or use Discover.',
  };
});
</script>

<style lang="scss" scoped>
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}
</style>

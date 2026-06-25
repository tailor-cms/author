<template>
  <VRow v-if="showSubfolders" class="folder-container" dense>
    <VCol
      v-for="folder in subfolders"
      :key="folder.path"
      cols="12"
      lg="4"
      sm="6"
    >
      <FolderRow
        :folder="folder"
        @open="emit('folder:open', $event)"
        @remove="emit('folder:remove', $event)"
        @delete="emit('folder:delete', $event)"
      />
    </VCol>
  </VRow>
  <div
    v-if="showLoading"
    class="d-flex justify-center py-16"
  >
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
          :is-selected="selected.has(asset.id)"
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
  <VEmptyState
    v-else-if="showEmptyState"
    :action-text="isInFolder ? 'Go back' : undefined"
    :icon="emptyStateIcon"
    :text="emptyStateText"
    :title="emptyStateTitle"
    bg-color="surface-container"
    class="py-16 empty-state rounded-lg"
    data-testid="assetEmptyState"
    @click:action="emit('folder:up')"
  />
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';
import type { FolderNode } from '~/composables/useAssetFolders';
import { CATEGORY_ALL } from '~/composables/useAssetFiltering';
import { oneLine } from 'common-tags';
import AssetRow from './AssetRow.vue';
import FolderRow from './FolderRow.vue';

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
  subfolders: FolderNode[];
  currentFolder: string;
  isLocalFolder: boolean;
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
  'folder:remove': [path: string];
  'folder:delete': [path: string];
  'folder:up': [];
}>();

const isFiltered = computed(
  () => props.selectedCategory !== CATEGORY_ALL || Boolean(props.search.trim()),
);

const showSubfolders = computed(
  () => !isFiltered.value && props.subfolders.length > 0,
);

const showLoading = computed(
  () => !props.assets.length && (props.isFetching || !props.foldersLoaded),
);

const showEmptyState = computed(
  () =>
    props.foldersLoaded &&
    !props.isFetching &&
    !props.assets.length &&
    !showSubfolders.value,
);

// Browsing inside a specific folder (not the library root, not search/filter).
const isInFolder = computed(
  () => !!props.currentFolder && !isFiltered.value,
);

const emptyStateIcon = computed(() =>
  isInFolder.value ? 'mdi-folder-open-outline' : 'mdi-image-multiple',
);

const emptyStateTitle = computed(() => {
  if (isFiltered.value) return 'No assets match your search or filter.';
  if (isInFolder.value) return 'This folder is empty.';
  return 'No assets uploaded yet.';
});

const emptyStateText = computed(() => {
  if (isFiltered.value) return 'Try adjusting your search or filters.';
  if (isInFolder.value) {
    if (props.isLocalFolder) {
      return oneLine`
        This folder is saved on your device until you add a file to it.
        Upload or move an asset here to keep it for everyone.
      `;
    }
    return 'Upload files here or move assets in.';
  }
  return 'Upload files, add links, or use Discover.';
});
</script>

<style lang="scss" scoped>
.folder-container {
  gap: 1rem;
  margin-bottom: 1.5rem;
}
</style>

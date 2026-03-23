<template>
  <VContainer class="py-8 px-sm-15" max-width="1440">
    <Toolbar
      ref="toolbarRef"
      v-model:search="searchQuery"
      @upload="uploadFiles"
      @link:add="showAddLinkDialog = true"
      @discover="showDiscoveryDialog = true"
    />
    <BulkActionBar
      :assets="assets"
      :selected-ids="selectedIds"
      :is-indexing="isIndexing"
      :is-bulk-deleting="isBulkDeleting"
      @select-all="selectAll"
      @clear="clearSelection"
      @index="indexSelected"
      @delete="confirmBulkDelete"
    />
    <div class="d-flex align-center flex-wrap ga-2 mb-4">
      <CategoryFilter v-model="selectedCategory" :categories="categories" />
      <VSpacer />
      <VBtn
        :append-icon="
          sortDirection === 'DESC'
            ? 'mdi-sort-descending'
            : 'mdi-sort-ascending'
        "
        color="primary-lighten-4"
        variant="text"
        @click="toggleSortDirection"
      >
        {{ sortDirection === 'DESC' ? 'Newest first' : 'Oldest first' }}
      </VBtn>
    </div>
    <AssetList
      :assets="processedAssets"
      :is-fetching="isFetching"
      :items-per-page="ITEMS_PER_PAGE"
      :page="page"
      :selected-ids="selectedIds"
      :selected-category="selectedCategory"
      :total="total"
      @delete="confirmDelete"
      @download="downloadAsset"
      @select="activeAsset = $event"
      @select:toggle="toggleSelect"
      @update:page="page = $event"
    />
    <AssetDetailDialog
      :asset="activeAsset"
      @close="activeAsset = null"
      @deindex="onDeindex"
      @delete="
        confirmDelete($event);
        activeAsset = null;
      "
      @download="downloadAsset"
      @updated="onAssetUpdated"
    />
    <AddLinkDialog
      v-model="showAddLinkDialog"
      @created="(url: string) => addLink(url).then(() => fetchAssets(fetchParams))"
    />
    <DiscoveryDialog
      v-model="showDiscoveryDialog"
      @added="fetchAssets(fetchParams)"
    />
  </VContainer>
</template>

<script lang="ts" setup>
import type { Asset, ProcessingStatus } from '@tailor-cms/interfaces/asset';
import { debounce } from 'lodash-es';

import AddLinkDialog from '@/components/repository/Assets/AddLinkDialog.vue';
import AssetDetailDialog from '@/components/repository/Assets/Detail/index.vue';
import AssetList from '@/components/repository/Assets/AssetList.vue';
import BulkActionBar from '@/components/repository/Assets/BulkActionBar.vue';
import CategoryFilter from '@/components/repository/Assets/CategoryFilter.vue';
import DiscoveryDialog from '@/components/repository/Assets/Discovery/index.vue';
import Toolbar from '@/components/repository/Assets/Toolbar.vue';
import { isIndexable } from '@/components/repository/Assets/utils';
import { useAssetFiltering } from '@/components/repository/Assets/useAssetFiltering';
import { useAssetIndexing } from '@/components/repository/Assets/useAssetIndexing';
import { useAssetSelection } from '@/components/repository/Assets/useAssetSelection';
import {
  ITEMS_PER_PAGE,
  useAssets,
} from '@/components/repository/Assets/useAssets';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  name: 'repository-assets',
});

const SEARCH_DEBOUNCE_MS = 300;
const currentRepositoryStore = useCurrentRepository();
const showConfirmation = useConfirmationDialog();

const toolbarRef = ref<InstanceType<typeof Toolbar>>();
const activeAsset = ref<Asset | null>(null);
const searchQuery = ref('');

const repositoryId = computed(() => currentRepositoryStore.repository?.id);

const {
  isFetching,
  assets,
  page,
  total,
  fetch: fetchAssets,
  upload,
  update: updateAsset,
  remove,
  bulkRemove,
  addLink,
  getDownloadUrl,
  deindex,
} = useAssets(repositoryId);

const {
  isIndexing,
  startIndexing,
  resumeIfActive,
  clearAssetStatus,
  indexingStatusMap,
} = useAssetIndexing(repositoryId);

const { categories, selectedCategory } = useAssetFiltering();

const {
  selectedIds,
  toggle: toggleSelect,
  selectAll,
  clear: clearSelection,
} = useAssetSelection(assets);

const isBulkDeleting = ref(false);
const showAddLinkDialog = ref(false);
const showDiscoveryDialog = ref(false);
const sortDirection = ref<'ASC' | 'DESC'>('DESC');

const fetchParams = computed(() => {
  const params: Record<string, any> = {
    orderBy: 'createdAt',
    orderDirection: sortDirection.value,
  };
  if (selectedCategory.value !== 'all') params.type = selectedCategory.value;
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
  return params;
});

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'DESC' ? 'ASC' : 'DESC';
  page.value = 1;
  fetchAssets(fetchParams.value);
}

const debouncedSearch = debounce(() => {
  page.value = 1;
  fetchAssets(fetchParams.value);
}, SEARCH_DEBOUNCE_MS);

function processAsset(asset: Asset): Asset {
  const status = indexingStatusMap.get(asset.id) as
    | ProcessingStatus
    | undefined;
  if (status && status !== asset.processingStatus) {
    return { ...asset, processingStatus: status };
  }
  return asset;
}

const processedAssets = computed(() =>
  assets.value.map((it) => processAsset(it)),
);

async function uploadFiles(files: File[]) {
  await upload(files);
  toolbarRef.value?.reset();
  fetchAssets(fetchParams.value);
}

async function downloadAsset(asset: Asset) {
  const result = await getDownloadUrl(asset.id);
  if (result?.url) window.open(result.url, '_blank');
}

async function indexSelected() {
  const ids = assets.value
    .filter((a) => selectedIds.has(a.id) && isIndexable(a))
    .map((a) => a.id);
  if (!ids.length) return;
  await startIndexing(ids);
  clearSelection();
}

async function onDeindex(asset: Asset) {
  await deindex(asset.id);
  clearAssetStatus(asset.id);
  activeAsset.value = null;
}

function onAssetUpdated(updated: Asset) {
  updateAsset(updated);
  activeAsset.value = null;
}

function confirmDelete(asset: Asset) {
  showConfirmation({
    title: 'Delete Asset',
    message: `Are you sure you want to delete "${asset.name}"?`,
    action: async () => {
      await remove(asset.id);
      selectedIds.delete(asset.id);
      fetchAssets(fetchParams.value);
    },
  });
}

function confirmBulkDelete() {
  showConfirmation({
    title: 'Delete Assets',
    message: `Are you sure you want to delete ${selectedIds.size} selected assets?`,
    action: async () => {
      isBulkDeleting.value = true;
      const deletedIds = await bulkRemove([...selectedIds]);
      deletedIds?.forEach((id: number) => selectedIds.delete(id));
      isBulkDeleting.value = false;
      fetchAssets(fetchParams.value);
    },
  });
}

watch(selectedCategory, () => {
  page.value = 1;
  fetchAssets(fetchParams.value);
});
watch(searchQuery, debouncedSearch);
watch(page, () => fetchAssets(fetchParams.value));

onMounted(async () => {
  await fetchAssets();
  resumeIfActive(assets.value);
});
</script>

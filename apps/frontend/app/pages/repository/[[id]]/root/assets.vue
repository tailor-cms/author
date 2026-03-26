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
      :assets="assetStore.assets.value"
      :selected-ids="selection.selectedIds"
      :is-indexing="indexing.isIndexing.value"
      :is-bulk-deleting="assetStore.isBulkRemoving.value"
      @clear="selection.clear"
      @index="indexSelected"
      @delete="confirmBulkDelete"
    />
    <ListControls
      v-model:selected-category="selectedCategory"
      v-model:items-per-page="assetStore.itemsPerPage.value"
      :categories="categories"
      :is-all-selected="isAllSelected"
      :sort-direction="sortDirection"
      @select-all="selection.selectAll"
      @deselect-all="selection.clear"
      @toggle-sort="toggleSortDirection"
    />
    <AssetList
      :assets="processedAssets"
      :is-fetching="assetStore.isFetching.value"
      :items-per-page="assetStore.itemsPerPage.value"
      :page="assetStore.page.value"
      :selected-ids="selection.selectedIds"
      :selected-category="selectedCategory"
      :total="assetStore.total.value"
      @delete="confirmDelete"
      @download="downloadAsset"
      @select="activeAsset = $event"
      @select:toggle="selection.toggle"
      @update:page="assetStore.page.value = $event"
    />
    <AssetDetailDialog
      :asset="activeAsset"
      :is-saving="assetStore.isSaving.value"
      @close="activeAsset = null"
      @deindex="onDeindex"
      @delete="confirmDelete($event); activeAsset = null"
      @download="downloadAsset"
      @save="onSaveMeta"
    />
    <AddLinkDialog
      v-model="showAddLinkDialog"
      @created="(url: string) => assetStore.addLink(url).then(refetch)"
    />
    <DiscoveryDialog
      v-model="showDiscoveryDialog"
      @added="refetch()"
    />
  </VContainer>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';
import { debounce } from 'lodash-es';

import AddLinkDialog from '@/components/repository/Assets/AddLinkDialog.vue';
import AssetDetailDialog from '@/components/repository/Assets/AssetDialog/index.vue';
import AssetList from '@/components/repository/Assets/AssetList/index.vue';
import BulkActionBar from '@/components/repository/Assets/BulkActionBar.vue';
import DiscoveryDialog from '@/components/repository/Assets/Discovery/index.vue';
import ListControls from '@/components/repository/Assets/ListControls/index.vue';
import Toolbar from '@/components/repository/Assets/Toolbar.vue';
import { isIndexable } from '@/components/repository/Assets/utils';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({ name: 'repository-assets' });

type SortDirection = 'ASC' | 'DESC';
const ASC: SortDirection = 'ASC';
const DESC: SortDirection = 'DESC';

const currentRepositoryStore = useCurrentRepository();
const showConfirmation = useConfirmationDialog();
const repositoryId = computed(() => currentRepositoryStore.repository?.id);

const assetStore = useAssets(repositoryId);
const indexing = useAssetIndexing(repositoryId);
const { categories, selectedCategory } = useAssetFiltering();
const selection = useAssetSelection(assetStore.assets);
const processedAssets = indexing.withStatus(assetStore.assets);

const toolbarRef = ref<InstanceType<typeof Toolbar>>();
const activeAsset = ref<Asset | null>(null);
const searchQuery = ref('');
const showAddLinkDialog = ref(false);
const showDiscoveryDialog = ref(false);
const sortDirection = ref<SortDirection>(DESC);

const isAllSelected = computed(
  () => assetStore.assets.value.length > 0
    && selection.selectedIds.size === assetStore.assets.value.length,
);

const fetchParams = computed(() => {
  const params: Record<string, any> = {
    orderBy: 'createdAt',
    orderDirection: sortDirection.value,
  };
  if (selectedCategory.value !== 'all') {
    params.type = selectedCategory.value;
  }
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim();
  }
  return params;
});

function refetch() {
  assetStore.fetch(fetchParams.value);
}

function resetAndFetch() {
  if (assetStore.page.value === 1) return refetch();
  // Setting page triggers the page watcher which calls refetch
  assetStore.page.value = 1;
}

async function uploadFiles(files: File[]) {
  await assetStore.upload(files);
  toolbarRef.value?.reset();
  refetch();
}

async function downloadAsset(asset: Asset) {
  const result = await assetStore.getDownloadUrl(asset.id);
  if (result?.url) window.open(result.url, '_blank');
}

async function indexSelected() {
  const ids = assetStore.assets.value
    .filter((a) => selection.selectedIds.has(a.id) && isIndexable(a))
    .map((a) => a.id);
  if (!ids.length) return;
  await indexing.startIndexing(ids);
  selection.clear();
}

async function onDeindex(asset: Asset) {
  await assetStore.deindex(asset.id);
  indexing.clearAssetStatus(asset.id);
  activeAsset.value = null;
}

async function onSaveMeta(asset: Asset, meta: Record<string, any>) {
  await assetStore.updateMeta(asset.id, meta);
  activeAsset.value = null;
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === DESC ? ASC : DESC;
  resetAndFetch();
}

function confirmDelete(asset: Asset) {
  showConfirmation({
    title: 'Delete Asset',
    message: `Are you sure you want to delete "${asset.name}"?`,
    action: async () => {
      await assetStore.remove(asset.id);
      selection.selectedIds.delete(asset.id);
      refetch();
    },
  });
}

function confirmBulkDelete() {
  showConfirmation({
    title: 'Delete Assets',
    message: `Delete ${selection.selectedIds.size} selected assets?`,
    action: async () => {
      const ids = await assetStore.bulkRemove([...selection.selectedIds]);
      ids?.forEach((id: number) => selection.selectedIds.delete(id));
      refetch();
    },
  });
}

const debouncedSearch = debounce(resetAndFetch, 300);
watch([selectedCategory, assetStore.itemsPerPage], resetAndFetch);
watch(searchQuery, debouncedSearch);
watch(assetStore.page, refetch);

onMounted(async () => {
  await assetStore.fetch(fetchParams.value);
  indexing.resumeIfActive(assetStore.assets.value);
});
</script>

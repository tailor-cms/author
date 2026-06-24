<template>
  <VLayout class="assets-page h-100">
    <VMain scrollable>
      <VContainer class="px-md-10 py-md-8" max-width="1200">
        <Toolbar
          ref="toolbarRef"
          v-model:search="searchQuery"
          class="mb-4"
          @upload="uploadFiles"
          @link:add="showAddLinkDialog = true"
          @discover="showDiscoveryDialog = true"
        />
        <BulkActionBar
          :selected="selection.selected"
          :is-all-selected="isAllSelected"
          :is-indexing="indexing.isIndexing.value"
          :is-bulk-deleting="assetStore.isBulkRemoving"
          @clear="selection.clear"
          @index="indexSelected"
          @move="openBulkMove"
          @delete="confirmBulkDelete"
          @toggle-all="$event ? selection.selectAll() : selection.deselectAll()"
        />
        <ListControls
          v-model:selected-category="selectedCategory"
          v-model:items-per-page="assetStore.itemsPerPage"
          v-model:view-mode="viewMode"
          :categories="categories"
          :sort-direction="sortDirection"
          @toggle-sort="toggleSortDirection"
        />
        <FolderBar
          v-if="viewMode === 'folders'"
          :breadcrumbs="breadcrumbs"
          :current-path="currentPath"
          :existing-names="subfolders.map((folder) => folder.name)"
          @navigate="navigateTo"
          @navigate-up="navigateUp"
          @create="onCreateFolder"
        />
        <AssetList
          :active-asset-id="activeAsset?.id ?? null"
          :assets="processedAssets"
          :is-fetching="assetStore.isFetching"
          :items-per-page="assetStore.itemsPerPage"
          :page="assetStore.page"
          :page-count="assetStore.pageCount"
          :search="searchQuery"
          :selected="selection.selected"
          :selected-category="selectedCategory"
          :total="assetStore.total"
          @delete="confirmDelete"
          @deindex="onDeindex"
          @download="downloadAsset"
          @index="(asset: Asset) => indexing.startIndexing([asset.id])"
          @preview="activeAsset = $event"
          @select:toggle="selection.toggle"
          @update:page="assetStore.page = $event"
        />
        <AddLinkDialog
          v-model="showAddLinkDialog"
          @add="(url: string) => assetStore.addLink(url).then(refetch)"
        />
        <DiscoveryDialog
          v-model="showDiscoveryDialog"
          @added="refetch()"
        />
        <MoveToFolderDialog
          v-model="showMoveDialog"
          :count="moveTargetIds.length"
          :folders="allFolders"
          @move="onMoveConfirm"
        />
      </VContainer>
    </VMain>
    <AssetSidebar
      :asset="activeAsset"
      :is-saving="assetStore.isSaving"
      @close="activeAsset = null"
      @deindex="onDeindex"
      @delete="confirmDelete"
      @download="downloadAsset"
      @index="(asset: Asset) => indexing.startIndexing([asset.id])"
      @move="openMove"
      @save="onSaveMeta"
    />
  </VLayout>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';
import { formatFileSize, isIndexable } from '@/components/repository/Assets/utils';
import { useUploadStore } from '@/stores/uploads';
import { debounce } from 'lodash-es';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';
import AddLinkDialog from '@/components/repository/Assets/AddLinkDialog.vue';
import AssetSidebar from '@/components/repository/Assets/AssetSidebar/index.vue';
import AssetList from '@/components/repository/Assets/AssetList/index.vue';
import BulkActionBar from '@/components/repository/Assets/BulkActionBar.vue';
import DiscoveryDialog from '@/components/repository/Assets/Discovery/index.vue';
import FolderBar from '@/components/repository/Assets/FolderBar/index.vue';
import ListControls from '@/components/repository/Assets/ListControls/index.vue';
import MoveToFolderDialog from '@/components/repository/Assets/MoveToFolderDialog.vue';
import Toolbar from '@/components/repository/Assets/Toolbar.vue';

definePageMeta({ name: 'repository-assets' });

type SortDirection = 'ASC' | 'DESC';

const ASC: SortDirection = 'ASC';
const DESC: SortDirection = 'DESC';

const configStore = useConfigStore();
const currentRepositoryStore = useCurrentRepository();
const uploadStore = useUploadStore();

const showConfirmation = useConfirmationDialog();
const notify = useNotification();

const maxUploadSize = computed(
  () => Number(configStore.props.storageMaxUploadSize) || Infinity,
);

const toolbarRef = ref<InstanceType<typeof Toolbar>>();
const sortDirection = ref<SortDirection>(DESC);
const searchQuery = ref('');
const activeAsset = ref<Asset | null>(null);
const showAddLinkDialog = ref(false);
const showDiscoveryDialog = ref(false);

const repositoryId = computed(() => currentRepositoryStore.repository?.id);

const assetStore = reactive(useAssets(repositoryId));
// reactive() unwraps inner refs, so assetStore.assets is a plain array.
// toRef() re-wraps it as a Ref so downstream composables stay reactive.
const assets = toRef(() => assetStore.assets);

const indexing = useAssetIndexing(repositoryId);
const processedAssets = indexing.withStatus(assets);

const { categories, selectedCategory } = useAssetFiltering();
const selection = useAssetSelection(assets);
const { isAllSelected } = selection;

const fetchParams = computed(() => {
  const params: Record<string, any> = {
    sortBy: 'createdAt',
    sortOrder: sortDirection.value,
  };
  if (selectedCategory.value !== CATEGORY_ALL) {
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
  if (assetStore.page === 1) return refetch();
  // Setting page triggers the page watcher which calls refetch
  assetStore.page = 1;
}

function uploadFiles(files: File[]) {
  toolbarRef.value?.reset();
  const id = repositoryId.value;
  if (!id) return;
  // Block the whole batch if any file exceeds the configured limit
  const tooLarge = files.filter((file) => file.size > maxUploadSize.value);
  if (tooLarge.length) {
    const names = tooLarge.map((file) => file.name).join(', ');
    notify(
      `Exceeds the ${formatFileSize(maxUploadSize.value)} upload limit: ${names}`,
      { color: 'error', immediate: true },
    );
    return;
  }
  uploadStore.start(files, id);
}

async function downloadAsset(asset: Asset) {
  const result = await assetStore.getDownloadUrl(asset.id);
  if (result?.url) window.open(result.url, '_blank');
}

async function indexSelected() {
  const ids = [...selection.selected.values()]
    .filter((a) => isIndexable(a))
    .map((a) => a.id);
  if (!ids.length) return;
  const label = ids.length === 1 ? 'asset' : 'assets';
  notify(`Indexing ${ids.length} ${label}`, { immediate: true });
  selection.clear();
  await indexing.startIndexing(ids);
}

async function onDeindex(asset: Asset) {
  await assetStore.deindex(asset.id);
  indexing.clearAssetStatus(asset.id);
  if (activeAsset.value?.id === asset.id) {
    const updated = assetStore.assets.find((a) => a.id === asset.id);
    if (updated) activeAsset.value = updated;
  }
}

async function onSaveMeta(asset: Asset, meta: Record<string, any>) {
  await assetStore.updateMeta(asset.id, meta);
  if (activeAsset.value?.id === asset.id) {
    const updated = assetStore.assets.find((a) => a.id === asset.id);
    if (updated) activeAsset.value = updated;
  }
  notify('Saved', { immediate: true });
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === DESC ? ASC : DESC;
  resetAndFetch();
}

function confirmDelete(asset: Asset) {
  showConfirmation({
    title: 'Delete Asset',
    color: 'error',
    message: `Are you sure you want to delete "${asset.name}"?`,
    action: async () => {
      await assetStore.remove(asset.id);
      selection.selected.delete(asset.id);
      activeAsset.value = null;
      refetch();
    },
  });
}

function confirmBulkDelete() {
  showConfirmation({
    title: 'Delete Assets',
    color: 'error',
    message: `Delete ${selection.selected.size} selected assets?`,
    action: async () => {
      const ids = await assetStore.bulkRemove([...selection.selected.keys()]);
      ids?.forEach((id: number) => selection.selected.delete(id));
      refetch();
    },
  });
}

const debouncedSearch = debounce(resetAndFetch, 300);

watch([selectedCategory, () => assetStore.itemsPerPage], resetAndFetch);
watch(searchQuery, debouncedSearch);
watch(() => assetStore.page, refetch);
watch(
  () => uploadStore.completedUploadsFor(repositoryId.value),
  (count, prev) => {
    if (count > prev) refetch();
  },
);

onMounted(async () => {
  await assetStore.fetch(fetchParams.value);
  indexing.resumeIfActive(assetStore.assets);
});

onBeforeUnmount(() => debouncedSearch.cancel());
</script>

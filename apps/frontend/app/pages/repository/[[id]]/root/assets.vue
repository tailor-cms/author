<template>
  <VLayout class="assets-page h-100">
    <VMain scrollable>
      <VContainer class="px-md-10 py-md-8" max-width="1400">
        <div v-if="isInitialLoading" class="d-flex justify-center py-16">
          <VProgressCircular indeterminate />
        </div>
        <AssetsEmptyState
          v-else-if="isEmptyLibrary"
          class="mt-4"
          @upload="uploadFiles"
          @link:add="showAddLinkDialog = true"
          @discover="showDiscoveryDialog = true"
          @folder:new="showNewFolderDialog = true"
        />
        <template v-else>
          <Toolbar
            v-model:search="searchQuery"
            class="mb-4"
            @upload="uploadFiles"
            @link:add="showAddLinkDialog = true"
            @discover="showDiscoveryDialog = true"
            @folder:new="showNewFolderDialog = true"
          />
          <CategoryFilter
            v-model="selectedCategory"
            :categories="categories"
            class="mb-4"
          />
          <FolderBreadcrumbs
            v-if="currentPath"
            :breadcrumbs="breadcrumbs"
            @navigate="browseTo"
            @navigate-up="browseUp"
          />
          <VRow
            v-if="showSubfolders"
            class="folder-container mb-4"
            density="compact"
          >
            <VCol
              v-for="folder in subfolders"
              :key="folder.path"
              cols="12"
              lg="4"
              sm="6"
            >
              <FolderRow
                :folder="folder"
                @open="browseTo"
                @remove="removeLocalFolder"
                @delete="onFolderDelete"
              />
            </VCol>
          </VRow>
          <template v-if="processedAssets.length">
            <VSlideYTransition mode="out-in">
              <BulkActionBar
                v-if="selection.selected.size"
                :selected="selection.selected"
                :is-all-selected="isAllSelected"
                :is-indexing="indexing.isIndexing.value"
                :is-bulk-deleting="assetStore.isBulkRemoving"
                @clear="selection.clear"
                @index="indexSelected"
                @move="openMove([...selection.selected.keys()])"
                @delete="confirmDelete([...selection.selected.keys()])"
                @toggle-all="
                  $event ? selection.selectAll() : selection.deselectAll()
                "
              />
              <DisplayControls
                v-else
                v-model:items-per-page="assetStore.itemsPerPage"
                v-model:view-mode="viewMode"
                :sort-direction="sortDirection"
                @toggle-sort="toggleSortDirection"
              />
            </VSlideYTransition>
          </template>
          <AssetList
            :active-asset-id="activeAsset?.id ?? null"
            :assets="processedAssets"
            :is-fetching="assetStore.isFetching"
            :folders-loaded="hasLoadedFolders"
            :items-per-page="assetStore.itemsPerPage"
            :page="assetStore.page"
            :page-count="assetStore.pageCount"
            :current-folder="currentPath"
            :is-local-folder="isLocalFolder"
            :search="searchQuery"
            :selected="selection.selected"
            :selected-category="selectedCategory"
            :has-folders="showSubfolders"
            :total="assetStore.total"
            :view-mode="viewMode"
            @delete="(asset: Asset) => confirmDelete([asset.id])"
            @deindex="onDeindex"
            @download="downloadAsset"
            @folder:open="browseTo"
            @folder:up="browseUp"
            @index="(asset: Asset) => indexing.startIndexing([asset.id])"
            @move="(asset: Asset) => openMove([asset.id])"
            @preview="activeAsset = $event"
            @select:toggle="selection.toggle"
            @update:page="assetStore.page = $event"
          />
        </template>
        <AddLinkDialog
          v-model="showAddLinkDialog"
          @add="(url: string) => assetStore.addLink(url).then(refetch)"
        />
        <DiscoveryDialog v-model="showDiscoveryDialog" @added="refetch()" />
        <MoveToFolderDialog
          v-model="showMoveDialog"
          :count="moveTargetIds.length"
          :folders="allFolders"
          @move="onMoveConfirm"
        />
        <NewFolderDialog
          v-model="showNewFolderDialog"
          :existing-names="subfolders.map((folder) => folder.name)"
          :parent-path="currentPath"
          @create="onCreateFolder"
        />
      </VContainer>
    </VMain>
    <AssetSidebar
      :asset="activeAsset"
      :is-saving="assetStore.isSaving"
      @close="activeAsset = null"
      @deindex="onDeindex"
      @delete="(asset: Asset) => confirmDelete([asset.id])"
      @download="downloadAsset"
      @index="(asset: Asset) => indexing.startIndexing([asset.id])"
      @move="(asset: Asset) => openMove([asset.id])"
      @save="onSave"
    />
  </VLayout>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';
import {
  formatFileSize,
  isIndexable,
} from '@/components/repository/Assets/utils';
import { CATEGORY_ALL } from '@/composables/useAssetFiltering';
import { debounce } from 'lodash-es';
import { useLocalStorage } from '@vueuse/core';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';
import { useUploadStore } from '@/stores/uploads';
import AddLinkDialog from '@/components/repository/Assets/AddLinkDialog.vue';
import AssetSidebar from '@/components/repository/Assets/AssetSidebar/index.vue';
import AssetList from '@/components/repository/Assets/AssetList/index.vue';
import AssetsEmptyState from '@/components/repository/Assets/AssetsEmptyState.vue';
import BulkActionBar from '@/components/repository/Assets/BulkActionBar.vue';
import CategoryFilter from '@/components/repository/Assets/CategoryFilter.vue';
import DisplayControls from '@/components/repository/Assets/DisplayControls.vue';
import DiscoveryDialog from '@/components/repository/Assets/Discovery/index.vue';
import FolderBreadcrumbs from '@/components/repository/Assets/FolderBreadcrumbs.vue';
import FolderRow from '@/components/repository/Assets/AssetList/FolderRow.vue';
import NewFolderDialog from '@/components/repository/Assets/NewFolderDialog.vue';
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

const sortDirection = ref<SortDirection>(DESC);
const viewMode = useLocalStorage<'grid' | 'list'>('assets:view-mode', 'list');
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

const {
  currentPath,
  breadcrumbs,
  allFolders,
  subfolders,
  isLocalFolder,
  navigateTo,
  navigateUp,
  createFolder,
  removeLocalFolder,
  refresh: refreshFolders,
  registerFolder,
  hasLoadedFolders,
} = useAssetFolders();

const showMoveDialog = ref(false);
const showNewFolderDialog = ref(false);
const moveTargetIds = ref<number[]>([]);

// Searching or filtering switches to a flat, files-only listing across all
// folders (so any asset stays findable now that there is no list view); plain
// browsing scopes to the current folder.
const isQuerying = computed(
  () => selectedCategory.value !== CATEGORY_ALL || !!searchQuery.value.trim(),
);

// Folders only show while plain-browsing (search/filter switches to a flat,
// global file listing). Also gates the asset list's empty state.
const showSubfolders = computed(
  () => !isQuerying.value && subfolders.value.length > 0,
);

// Gate the page's top-level layout on the first fetch settling, so we never
// flash the toolbar + list spinner before resolving to the empty state.
// Later navigations keep the toolbar; per-fetch loading is shown by the list.
const hasFirstFetched = ref(false);
const isInitialLoading = computed(
  () => !hasFirstFetched.value || !hasLoadedFolders.value,
);

// True first-run state: nothing uploaded, no folders, at the library root, and
// not searching/filtering. This is the only case that gets the action-card
// empty state (with the toolbar hidden, since the cards offer the actions);
// empty-folder and no-match states keep the contextual list empty state and
// the toolbar.
const isEmptyLibrary = computed(
  () =>
    hasLoadedFolders.value &&
    !assetStore.isFetching &&
    !processedAssets.value.length &&
    !subfolders.value.length &&
    !isQuerying.value &&
    !currentPath.value,
);

const fetchParams = computed(() => {
  const params: Record<string, any> = {
    sortBy: 'createdAt',
    sortOrder: sortDirection.value,
    // Pre-signed publicUrl per row so the grid can render image thumbnails.
    signed: true,
  };
  if (selectedCategory.value !== CATEGORY_ALL) {
    params.type = selectedCategory.value;
  }
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim();
  }
  if (!isQuerying.value) params.folder = currentPath.value;
  return params;
});

// Re-fetch the current page of assets.
function refetch() {
  assetStore.fetch(fetchParams.value);
}

// Re-fetch from the first page (the query changed, so pagination resets).
function resetAndFetch() {
  if (assetStore.page === 1) return refetch();
  // Setting page triggers the page watcher, which calls refetch.
  assetStore.page = 1;
}

// Re-fetch the asset list AND the folder tree, after a mutation that can affect
// both (move / delete / upload).
function refetchAll() {
  refetch();
  refreshFolders();
}

function uploadFiles(files: File[]) {
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
  // New uploads land in the folder the user is browsing
  uploadStore.start(files, id, currentPath.value);
}

// Pluralized "<n> asset(s)" for notifications.
const assetLabel = (n: number) => `${n} ${n === 1 ? 'asset' : 'assets'}`;

// Close the detail sidebar when its asset is affected by a mutation.
function closeSidebarIf(affected: (asset: Asset) => boolean) {
  if (activeAsset.value && affected(activeAsset.value))
    activeAsset.value = null;
}

// Re-sync the open sidebar asset from the store after an in-place update.
function syncActiveAsset(id: number) {
  if (activeAsset.value?.id !== id) return;
  const updated = assetStore.assets.find((a) => a.id === id);
  if (updated) activeAsset.value = updated;
}

// Open the move dialog for the given assets (a single row or the selection).
function openMove(ids: number[]) {
  if (!ids.length) return;
  moveTargetIds.value = ids;
  showMoveDialog.value = true;
}

async function onMoveConfirm(folder: string) {
  const ids = moveTargetIds.value;
  if (!ids.length) return;
  await assetStore.move(ids, folder);
  ids.forEach((id) => selection.selected.delete(id));
  closeSidebarIf((a) => ids.includes(a.id));
  notify(`Moved ${assetLabel(ids.length)}`, { immediate: true });
  if (folder) registerFolder(folder);
  refetchAll();
}

// Search and category both switch the listing to a flat, global "find" view;
// resetting them returns to plain folder browsing.
function resetFilters() {
  searchQuery.value = '';
  selectedCategory.value = CATEGORY_ALL;
}

// Navigating is a browse action, so clear any active search/filter - otherwise
// a stale one would keep the listing global instead of scoped to the folder.
function browseTo(path: string) {
  resetFilters();
  navigateTo(path);
}

function browseUp() {
  resetFilters();
  navigateUp();
}

function onCreateFolder(name: string) {
  const path = createFolder(name);
  if (path) browseTo(path);
}

function onFolderDelete(path: string) {
  const name = path.split('/').pop() || path;
  const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
  const inSubtree = (folder: string) =>
    folder === path || folder.startsWith(`${path}/`);
  showConfirmation({
    title: 'Delete Folder',
    color: 'error',
    message: `Delete "${name}" and everything in it? This can't be undone.`,
    action: async () => {
      await assetStore.deleteFolder(path);
      selection.clear();
      closeSidebarIf((a) =>
        inSubtree((a.meta as { folder?: string })?.folder ?? ''),
      );
      if (inSubtree(currentPath.value)) browseTo(parent);
      else refetch();
      await refreshFolders();
    },
  });
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
  notify(`Indexing ${assetLabel(ids.length)}`, { immediate: true });
  selection.clear();
  await indexing.startIndexing(ids);
}

async function onDeindex(asset: Asset) {
  await assetStore.deindex(asset.id);
  indexing.clearAssetStatus(asset.id);
  syncActiveAsset(asset.id);
}

async function onSave(
  asset: Asset,
  payload: { meta: Record<string, any>; name?: string },
) {
  await assetStore.updateAsset(asset.id, payload);
  syncActiveAsset(asset.id);
  notify('Saved', { immediate: true });
}

function toggleSortDirection() {
  // The watcher on sortDirection re-lists from page 1.
  sortDirection.value = sortDirection.value === DESC ? ASC : DESC;
}

function confirmDelete(ids: number[]) {
  if (!ids.length) return;
  const single = ids.length === 1;
  const name = single
    ? assetStore.assets.find((a) => a.id === ids[0])?.name
    : null;
  showConfirmation({
    title: single ? 'Delete Asset' : 'Delete Assets',
    color: 'error',
    message: single
      ? `Are you sure you want to delete "${name}"?`
      : `Delete ${assetLabel(ids.length)}?`,
    action: async () => {
      await (single
        ? assetStore.remove(ids[0] as number)
        : assetStore.bulkRemove(ids));
      ids.forEach((id) => selection.selected.delete(id));
      closeSidebarIf((a) => ids.includes(a.id));
      refetchAll();
    },
  });
}

const debouncedSearch = debounce(resetAndFetch, 300);

// What the listing is scoped to: the current folder while browsing, or the
// whole repo (null) while searching/filtering.
const fetchScope = computed(() =>
  isQuerying.value ? null : currentPath.value,
);
watch(fetchScope, () => assetStore.invalidate());

watch(
  [selectedCategory, sortDirection, currentPath, () => assetStore.itemsPerPage],
  resetAndFetch,
);
watch(searchQuery, debouncedSearch);
watch(() => assetStore.page, refetch);

watch(
  () => uploadStore.completedUploadsFor(repositoryId.value),
  (count, prev) => {
    if (count > prev) refetchAll();
  },
);

onMounted(async () => {
  refreshFolders();
  await assetStore.fetch(fetchParams.value);
  hasFirstFetched.value = true;
  indexing.resumeIfActive(assetStore.assets);
});

onBeforeUnmount(() => debouncedSearch.cancel());
</script>

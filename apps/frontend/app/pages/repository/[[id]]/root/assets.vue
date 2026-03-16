<template>
  <VContainer class="py-8 px-sm-15" max-width="1440">
    <Toolbar
      ref="toolbarRef"
      @upload="uploadFiles"
      @add-link="showAddLinkDialog = true"
      @discover="showDiscoveryDialog = true"
    />
    <BulkActionBar
      :selected-ids="selectedIds"
      :is-indexing="isIndexing"
      :is-bulk-deleting="isBulkDeleting"
      @select-all="selectAll"
      @clear="clearSelection"
      @index="indexSelected"
      @delete="confirmBulkDelete"
    />
    <CategoryFilter v-model="selectedCategory" :categories="categories" />
    <!-- Loading skeleton -->
    <VRow v-if="isFetching">
      <VCol
        v-for="n in 8"
        :key="n"
        cols="12"
        sm="6"
        md="4"
        lg="3">
        <VSkeletonLoader
          color="primary-darken-4"
          type="image, list-item-two-line, actions"
        />
      </VCol>
    </VRow>
    <VDataIterator
      v-else-if="filteredAssets.length"
      :items="filteredAssets"
      :items-per-page="12"
    >
      <template #default="{ items }">
        <VRow>
          <VCol
            v-for="{ raw: asset } in items"
            :key="asset.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <AssetCard
              :asset="processAsset(asset)"
              :selected="selectedIds.has(asset.id)"
              :selection-mode="selectedIds.size > 0"
              @delete="confirmDelete"
              @download="downloadAsset"
              @open-detail="activeAsset = processAsset(asset)"
              @toggle-select="toggleSelect(asset)"
            />
          </VCol>
        </VRow>
      </template>
      <template #footer="{ pageCount, page, prevPage, nextPage }">
        <div
          v-if="pageCount > 1"
          class="d-flex align-center justify-center pa-4 gap-2"
        >
          <VBtn
            :disabled="page === 1"
            color="primary-lighten-3"
            icon="mdi-chevron-left"
            size="small"
            variant="tonal"
            @click="prevPage"
          />
          <span class="text-primary-lighten-4 text-body-2">
            Page {{ page }} of {{ pageCount }}
          </span>
          <VBtn
            :disabled="page === pageCount"
            color="primary-lighten-3"
            icon="mdi-chevron-right"
            size="small"
            variant="tonal"
            @click="nextPage"
          />
        </div>
      </template>
    </VDataIterator>
    <div
      v-else-if="!isFetching"
      class="empty-state d-flex flex-column align-center py-16"
    >
      <VIcon
        color="primary-lighten-2"
        icon="mdi-folder-open-outline"
        size="64"
      />
      <div class="text-body-1 text-primary-lighten-3 mt-4">
        {{
          assets.length
            ? 'No assets match the selected filter.'
            : 'No assets uploaded yet.'
        }}
      </div>
      <div
        v-if="!assets.length"
        class="text-caption text-primary-lighten-2 mt-1"
      >
        Upload files, add links, or use Discover.
      </div>
    </div>
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
    <AddLinkDialog v-model="showAddLinkDialog" @created="addLink" />
    <DiscoveryDialog
      v-model="showDiscoveryDialog"
      @assets-added="prependAssets"
    />
  </VContainer>
</template>

<script lang="ts" setup>
import AddLinkDialog from '@/components/repository/Assets/AddLinkDialog.vue';
import AssetCard from '@/components/repository/Assets/AssetCard.vue';
import AssetDetailDialog from '@/components/repository/Assets/Detail/index.vue';
import BulkActionBar from '@/components/repository/Assets/BulkActionBar.vue';
import CategoryFilter from '@/components/repository/Assets/CategoryFilter.vue';
import DiscoveryDialog from '@/components/repository/Assets/Discovery/index.vue';
import Toolbar from '@/components/repository/Assets/Toolbar.vue';
import { useAssetFiltering } from '@/components/repository/Assets/useAssetFiltering';
import { useAssetIndexing } from '@/components/repository/Assets/useAssetIndexing';
import { useAssetSelection } from '@/components/repository/Assets/useAssetSelection';
import { useAssets } from '@/components/repository/Assets/useAssets';
import { useConfirmationDialog } from '@/composables/useConfirmationDialog';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({
  name: 'repository-assets',
});

const currentRepositoryStore = useCurrentRepository();
const showConfirmation = useConfirmationDialog();

const toolbarRef = ref<InstanceType<typeof Toolbar>>();
const activeAsset = ref<any>(null);

const repositoryId = computed(() => currentRepositoryStore.repository?.id);

const {
  assets,
  isFetching,
  fetch,
  upload,
  addLink,
  getDownloadUrl,
  remove,
  bulkRemove,
  deindex,
  updateAsset,
  prependAssets,
} = useAssets(repositoryId);

const {
  isIndexing,
  indexingAssets,
  startIndexing,
  resumeIfActive,
  clearAssetStatus,
} = useAssetIndexing(repositoryId);

const { categories, selectedCategory, filteredAssets } =
  useAssetFiltering(assets);

const {
  selectedIds,
  toggle: toggleSelect,
  selectAll,
  clear: clearSelection,
} = useAssetSelection(filteredAssets);

// UI state
const isBulkDeleting = ref(false);
const showAddLinkDialog = ref(false);
const showDiscoveryDialog = ref(false);

function processAsset(asset: any) {
  const status = indexingAssets.get(asset.id);
  if (status && status !== asset.processingStatus) {
    return { ...asset, processingStatus: status };
  }
  return asset;
}

async function uploadFiles(files: File[]) {
  await upload(files);
  toolbarRef.value?.reset();
}

async function downloadAsset(asset: any) {
  const result = await getDownloadUrl(asset.id);
  if (result?.url) window.open(result.url, '_blank');
}

async function indexSelected() {
  const ids = [...selectedIds];
  if (!ids.length) return;
  await startIndexing(ids);
  clearSelection();
}

async function onDeindex(asset: any) {
  await deindex(asset.id);
  clearAssetStatus(asset.id);
  activeAsset.value = null;
}

function onAssetUpdated(updated: any) {
  updateAsset(updated);
  activeAsset.value = null;
}

function confirmDelete(asset: any) {
  showConfirmation({
    title: 'Delete Asset',
    message: `Are you sure you want to delete "${asset.name}"?`,
    action: async () => {
      await remove(asset.id);
      selectedIds.delete(asset.id);
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
    },
  });
}

onMounted(async () => {
  await fetch();
  resumeIfActive(assets.value);
});
</script>

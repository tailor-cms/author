<template>
  <div class="library-tab">
    <VTextField
      v-model="searchQuery"
      color="primary-darken-2"
      density="compact"
      placeholder="Search assets..."
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      hide-details
      @update:model-value="onSearchChange"
    />
    <CategoryFilter
      v-if="categoryFilters.length > 1"
      v-model="selectedCategory"
      :categories="categoryFilters"
    />
    <div v-if="isLoading && !assets.length" class="d-flex justify-center py-12">
      <VProgressCircular color="primary-darken-2" size="42" indeterminate />
    </div>
    <div
      v-else-if="!assets.length && !isLoading"
      class="d-flex flex-column align-center py-12"
    >
      <VIcon class="mb-2" color="primary" size="48">
        mdi-folder-open-outline
      </VIcon>
      <div class="text-body-2 text-medium-emphasis">
        {{ hasActiveFilters ? 'No matching assets' : 'No assets found' }}
      </div>
    </div>
    <AssetList
      v-else
      :allowed-extensions="allowedExtensions"
      :assets="assets"
      :class="{ 'opacity-70': isLoading }"
      :multiple="multiple"
      :selected-ids="selectedIds"
      class="mt-2"
      @update:selected="onSelectionChange"
    />
    <VPagination
      v-if="pageCount > 1"
      v-model="page"
      :length="pageCount"
      :total-visible="5"
      class="mt-2"
      color="primary-darken-2"
      density="comfortable"
      size="small"
      rounded
    />
  </div>
</template>

<script lang="ts" setup>
import {
  AssetType,
  inferAssetType,
  type Asset,
} from '@tailor-cms/interfaces/asset.ts';
import { computed, inject, onMounted, ref, watch } from 'vue';
import { debounce } from 'lodash-es';
import pMinDelay from 'p-min-delay';

import AssetList from './AssetList.vue';
import CategoryFilter from './CategoryFilter.vue';

const ITEMS_PER_PAGE = 10;
const MIN_LOADING_MS = 800;

const ALL_CATEGORIES: { label: string; value: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Images', value: AssetType.Image },
  { label: 'Documents', value: AssetType.Document },
  { label: 'Video', value: AssetType.Video },
  { label: 'Audio', value: AssetType.Audio },
  { label: 'Other', value: AssetType.Other },
];

const storageService = inject<any>('$storageService');

const props = withDefaults(
  defineProps<{
    allowedExtensions?: string[];
    multiple?: boolean;
  }>(),
  {
    allowedExtensions: () => [],
    multiple: false,
  },
);

const isLoading = ref(false);
const searchQuery = ref('');
const selectedCategory = ref('ALL');
const page = ref(1);
const assets = ref<Asset[]>([]);
const total = ref(0);
const pageCount = computed(() => Math.ceil(total.value / ITEMS_PER_PAGE));

const selected = defineModel<Asset | Asset[] | null>('selected', {
  default: null,
});

const selectedIds = computed(() => {
  if (!selected.value) return [];
  return Array.isArray(selected.value)
    ? selected.value.map((it) => it.id)
    : [selected.value.id];
});

// When allowedExtensions all belong to one asset type
// (e.g. ['.jpg', '.png'] → image), category filtering is redundant
// since results are already scoped to that type.
const inferredType = computed(() => inferAssetType(props.allowedExtensions));
const categoryFilters = computed(() => {
  if (inferredType.value) return [];
  return ALL_CATEGORIES;
});

const hasActiveFilters = computed(
  () => !!searchQuery.value.trim() || selectedCategory.value !== 'ALL',
);

const fetchAssets = async () => {
  if (!storageService?.list) return;
  isLoading.value = true;
  try {
    const params: Record<string, any> = {
      offset: (page.value - 1) * ITEMS_PER_PAGE,
      limit: ITEMS_PER_PAGE,
    };
    const search = searchQuery.value.trim();
    if (search) params.search = search;
    if (selectedCategory.value !== 'ALL') {
      params.type = selectedCategory.value;
    } else if (inferredType.value) {
      params.type = inferredType.value;
    }
    const promise: Promise<{ items: Asset[]; total: number }> =
      storageService.list(params);
    const { items, total: count } = await pMinDelay(promise, MIN_LOADING_MS);
    assets.value = items;
    total.value = count;
  } finally {
    isLoading.value = false;
  }
};

const onSelectionChange = (ids: number[]) => {
  if (!props.multiple) {
    selected.value = assets.value.find((a) => a.id === ids[0]) ?? null;
    return;
  }
  // VList preserves non-rendered IDs internally, so ids includes
  // selections from other pages - resolve all to Asset objects
  const prev = Array.isArray(selected.value) ? selected.value : [];
  const prevById = new Map(prev.map((a) => [a.id, a]));
  selected.value = ids
    .map((id) => assets.value.find((a) => a.id === id) ?? prevById.get(id))
    .filter(Boolean) as Asset[];
};

const fetchFromStart = () => {
  if (page.value === 1) fetchAssets();
  else page.value = 1; // triggers page watcher
};

const onSearchChange = debounce(fetchFromStart, 300);

watch(selectedCategory, fetchFromStart);
watch(page, fetchAssets);

onMounted(fetchAssets);
</script>

<style lang="scss" scoped>
.library-tab {
  padding: 2rem;
}
</style>

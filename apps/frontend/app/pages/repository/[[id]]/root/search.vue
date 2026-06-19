<template>
  <div class="search-page overflow-auto h-100">
    <VContainer class="px-md-10 py-md-8" max-width="1100">
      <Toolbar
        v-model:search="searchInput"
        v-model:types="selectedTypes"
        :type-options="typeOptions"
        class="mb-4"
      />
      <ListControls
        v-if="results.total"
        v-model:is-compact="isCompact"
        v-model:items-per-page="results.itemsPerPage"
        v-model:page="results.page"
        v-model:sort="sort"
        :is-search-active="isSearchActive"
        :page-count="results.pageCount"
        :total="results.total"
        class="mb-4"
      />
      <template v-if="results.isFetching">
        <VSkeletonLoader
          v-for="it in 3"
          :key="it"
          class="mb-4 rounded-lg"
          type="list-item-avatar, image"
        />
      </template>
      <VEmptyState
        v-else-if="!results.elements.length"
        :icon="isSearchActive ? 'mdi-magnify-close' : 'mdi-magnify'"
        :text="emptyStateText"
        :title="isSearchActive ? 'No matches' : 'Nothing here yet'"
        bg-color="surface-container"
        class="rounded-lg py-16 mt-4"
      >
        <template v-if="hasActiveFilters" #actions>
          <VBtn
            text="Clear search & filters"
            @click="clearFilters"
          />
        </template>
      </VEmptyState>
      <template v-else>
        <ElementCard
          v-for="element in results.elements"
          :key="element.uid"
          :class="isCompact ? 'mb-2' : 'mb-4'"
          :element="element"
          :search-terms="searchTerms"
          :is-compact="isCompact"
          @element:preview="previewedElement = $event"
        />
        <VPagination
          v-if="results.pageCount > 1"
          v-model="results.page"
          v-bind="paginationProps"
          class="mt-6"
        />
      </template>
    </VContainer>
    <PreviewDialog
      v-if="previewedElement"
      :element="previewedElement"
      :search-terms="searchTerms"
      @close="previewedElement = null"
      @element:navigate="openInEditor"
    />
  </div>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router';
import { debounce } from 'lodash-es';
import { useLocalStorage } from '@vueuse/core';

import {
  DEFAULT_PAGE_SIZE,
  parseSearchTerms,
  useContentElementSearch,
  useSearchHistory,
  type SearchElement,
  type SearchSort,
} from '@/components/repository/Search/composables';
import ElementCard from '@/components/repository/Search/ElementCard.vue';
import ListControls from '@/components/repository/Search/ListControls.vue';
import PreviewDialog from '@/components/repository/Search/PreviewDialog.vue';
import Toolbar from '@/components/repository/Search/Toolbar.vue';
import { useCurrentRepository } from '@/stores/current-repository';

definePageMeta({ name: 'search' });

const SORT_VALUES: SearchSort[] = ['relevance', 'newest', 'oldest'];

const { $ceRegistry, $eventBus } = useNuxtApp() as any;

const route = useRoute();
const router = useRouter();
const currentRepositoryStore = useCurrentRepository();

// Injection context the content-element renderer reads: `ceRegistry`
// (and `editorState`, for question elements) are required; `editorBus` is
// only hit by edit interactions, which `is-disabled` suppresses - kept as
// a no-op safety net.
provide('$editorBus', $eventBus.channel('editor'));
provide('$ceRegistry', $ceRegistry);
provide('$editorState', { isPublishDiff: computed(() => false) });

const repositoryId = computed(() => currentRepositoryStore.repository?.id);
const typeOptions = computed(() =>
  $ceRegistry.all.map((it: any) => ({
    title: it.name,
    value: it.type,
    icon: it.ui?.icon,
  })),
);
const searchHistory = useSearchHistory();
const results = reactive(useContentElementSearch(repositoryId));

// Restore last search from localStorage, unless the URL carries state
const hasUrlState = ['q', 'types', 'sort', 'page'].some((k) => k in route.query);
const restored = hasUrlState ? null : searchHistory.get(repositoryId.value);
const searchInput = ref(restored?.q ?? ((route.query.q as string) ?? '').trim());
const appliedSearch = ref(searchInput.value);
const selectedTypes = ref<string[]>(
  restored?.types ??
    (route.query.types ? String(route.query.types).split(',') : []),
);

const defaultSort = computed<SearchSort>(() =>
  isSearchActive.value ? 'relevance' : 'newest',
);
const sort = ref<SearchSort>(initialSort());

const paginationProps = computed(() => ({
  length: results.pageCount,
  totalVisible: 7,
  density: 'comfortable' as const,
  rounded: true,
}));
results.page = restored?.page ?? (Number(route.query.page) || 1);
if (restored?.itemsPerPage) results.itemsPerPage = restored.itemsPerPage;

const emptyStateText = computed(() =>
  isSearchActive.value
    ? `No elements match "${appliedSearch.value}"`
    : 'This repository has no content elements yet.',
);

// Display density preference
const isCompact = useLocalStorage('tailor-cms-ce-search:compact', false);
const isSearchActive = computed(() => !!appliedSearch.value);
const searchTerms = computed(() => parseSearchTerms(appliedSearch.value));
const hasActiveFilters = computed(
  () => isSearchActive.value || selectedTypes.value.length > 0,
);

const previewedElement = ref<SearchElement | null>(null);

function initialSort(): SearchSort {
  if (restored) return restored.sort;
  const fromUrl = route.query.sort as SearchSort | undefined;
  if (fromUrl && SORT_VALUES.includes(fromUrl)) return fromUrl;
  return route.query.q ? 'relevance' : 'newest';
}

const fetchParams = computed(() => {
  const params: Record<string, any> = {};
  if (isSearchActive.value) params.search = appliedSearch.value;
  if (selectedTypes.value.length) params.types = selectedTypes.value;
  if (sort.value !== 'relevance') {
    params.sortBy = 'updatedAt';
    params.sortOrder = sort.value === 'newest' ? 'DESC' : 'ASC';
  }
  return params;
});

function updateUrl() {
  const query: Record<string, string> = {};
  if (isSearchActive.value) query.q = appliedSearch.value;
  if (selectedTypes.value.length) query.types = selectedTypes.value.join(',');
  if (sort.value !== defaultSort.value) query.sort = sort.value;
  if (results.page > 1) query.page = String(results.page);
  router.replace({ query });
}

// Saving into localStorage
function saveSearch() {
  const isDefault =
    !appliedSearch.value &&
    !selectedTypes.value.length &&
    sort.value === defaultSort.value &&
    results.page === 1 &&
    results.itemsPerPage === DEFAULT_PAGE_SIZE;
  if (isDefault) return searchHistory.clear(repositoryId.value);
  searchHistory.set(repositoryId.value, {
    q: appliedSearch.value,
    types: selectedTypes.value,
    sort: sort.value,
    page: results.page,
    itemsPerPage: results.itemsPerPage,
  });
}

function refetch() {
  updateUrl();
  saveSearch();
  results.fetch(fetchParams.value);
}

function resetAndFetch() {
  if (results.page === 1) return refetch();
  results.page = 1;
}

function clearFilters() {
  applySearch.cancel();
  searchInput.value = '';
  appliedSearch.value = '';
  selectedTypes.value = [];
}

function openInEditor(_element: SearchElement, editorRoute: RouteLocationRaw) {
  navigateTo(editorRoute);
}

const applySearch = debounce(() => {
  appliedSearch.value = searchInput.value?.trim() ?? '';
}, 300);

watch(searchInput, applySearch);

// Handle sort-value upon toggling search
watch(isSearchActive, (active) => {
  if (active && sort.value === 'newest') sort.value = 'relevance';
  if (!active && sort.value === 'relevance') sort.value = 'newest';
});
watch([fetchParams, () => results.itemsPerPage], resetAndFetch);
watch(() => results.page, refetch);

onMounted(async () => {
  if (restored) updateUrl();
  await results.fetch(fetchParams.value);
  if (results.page > results.pageCount) results.page = 1;
});

onBeforeUnmount(() => applySearch.cancel());
</script>

<style>
::highlight(search-term) {
  background-color: rgb(var(--v-theme-primary-container));
  color: rgb(var(--v-theme-on-primary-container));
}
</style>

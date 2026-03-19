<template>
  <VDialog v-model="show" transition="dialog-bottom-transition" fullscreen>
    <VCard class="discovery-dialog" color="primary-darken-4">
      <VToolbar color="primary-darken-3" density="comfortable" height="84">
        <VToolbarTitle class="text-primary-lighten-4 ml-4">
          <VIcon
            class="mx-2"
            color="teal-lighten-4"
            icon="mdi-earth-plus"
            size="small"
          />
          Discover Resources
        </VToolbarTitle>
        <template #append>
          <VBtn
            v-if="selectedUrls.size"
            :loading="isAdding"
            :prepend-icon="hasDownloadable ? 'mdi-download' : 'mdi-link-plus'"
            class="mr-4"
            color="primary-lighten-3"
            variant="outlined"
            @click="addSelected(false)"
          >
            {{ hasDownloadable ? 'Import' : 'Add as links' }}
            {{ selectedUrls.size }}
          </VBtn>
          <VBtn
            v-if="selectedUrls.size"
            :loading="isAdding"
            class="mr-4"
            color="primary-lighten-3"
            prepend-icon="mdi-brain"
            variant="tonal"
            @click="addSelected(true)"
          >
            {{ hasDownloadable ? 'Import' : 'Add' }} & Index
          </VBtn>
          <VBtn icon="mdi-close" @click="show = false" />
        </template>
      </VToolbar>
      <VContainer class="discovery-content pt-6" fluid>
        <VRow justify="center">
          <VCol cols="12" lg="10" xl="8">
            <SearchBar
              v-model:query="query"
              v-model:content-filter="contentFilter"
              :is-searching="isSearching"
              @search="search"
            />
            <SearchResults
              v-model:page="page"
              :suggestions="suggestions"
              :selected-urls="selectedUrls"
              :is-searching="isSearching"
              :has-searched="hasSearched"
              @toggle="toggleSuggestion"
              @select-all="selectAll"
              @deselect-all="selectedUrls.clear()"
            />
          </VCol>
        </VRow>
      </VContainer>
    </VCard>
  </VDialog>
</template>

<script lang="ts" setup>
import type {
  ContentFilter,
  DiscoveryResult,
} from '@tailor-cms/interfaces/discovery';

import api from '@/api/repositoryAsset';
import SearchResults from './SearchResults/index.vue';
import SearchBar from './SearchBar.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const DOWNLOADABLE_TYPES = new Set(['image', 'pdf', 'video', 'audio']);
const FETCH_COUNT = 100;

const show = defineModel<boolean>({ default: false });
const emit = defineEmits(['assets-added']);

const currentRepositoryStore = useCurrentRepository();
const repositoryId = computed(() => currentRepositoryStore.repository?.id);

const query = ref('');
const contentFilter = ref<ContentFilter>('all');

const isAdding = ref(false);
const isSearching = ref(false);
const hasSearched = ref(false);

const suggestions = ref<DiscoveryResult[]>([]);
const selectedUrls = reactive(new Set<string>());
const page = ref(1);

const hasDownloadable = computed(() => {
  if (!selectedUrls.size) return false;
  return suggestions.value
    .filter((s) => selectedUrls.has(s.url))
    .some((s) => DOWNLOADABLE_TYPES.has(s.type));
});

async function search() {
  if (!query.value.trim() || !repositoryId.value) return;
  isSearching.value = true;
  hasSearched.value = false;
  suggestions.value = [];
  selectedUrls.clear();
  page.value = 1;
  try {
    suggestions.value = await api.discover(
      repositoryId.value,
      query.value,
      contentFilter.value,
      FETCH_COUNT,
    );
  } finally {
    isSearching.value = false;
    hasSearched.value = true;
  }
}

function toggleSuggestion(url: string) {
  if (selectedUrls.has(url)) selectedUrls.delete(url);
  else selectedUrls.add(url);
}

function selectAll() {
  suggestions.value.forEach((s) => selectedUrls.add(s.url));
}

async function addSelected(shouldIndex = false) {
  if (!repositoryId.value) return;
  isAdding.value = true;
  const resultByUrl = new Map(suggestions.value.map((s) => [s.url, s]));
  const addedAssets: Array<{ id: number }> = [];
  for (const url of selectedUrls) {
    try {
      const result = resultByUrl.get(url);
      const asset = await api.importFromLink(repositoryId.value, url, {
        contentType: result?.type,
        title: result?.title,
        description: result?.description || result?.snippet,
        downloadUrl: result?.downloadUrl,
        author: result?.author,
        license: result?.license,
        tags: result?.tags,
      });
      addedAssets.push(asset);
    } catch {
      // Skip failed individual links
    }
  }
  if (shouldIndex && addedAssets.length) {
    const assetIds = addedAssets.map((a) => a.id);
    await api.indexAssets(repositoryId.value, assetIds);
  }
  isAdding.value = false;
  emit('assets-added', addedAssets);
  show.value = false;
}

watch(show, (v) => {
  if (!v) return;
  query.value = '';
  contentFilter.value = 'all';
  suggestions.value = [];
  selectedUrls.clear();
  hasSearched.value = false;
  page.value = 1;
});

watch(contentFilter, () => {
  if (query.value.trim()) search();
});
</script>

<style lang="scss" scoped>
.discovery-dialog {
  display: flex;
  flex-direction: column;
}

.discovery-content {
  flex: 1;
  overflow-y: auto;
}
</style>

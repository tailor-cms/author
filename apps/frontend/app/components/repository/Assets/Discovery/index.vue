<template>
  <VDialog v-model="show" transition="dialog-bottom-transition" fullscreen>
    <VCard class="discovery-dialog" color="primary-darken-4">
      <VToolbar color="primary-darken-3" density="comfortable" height="84">
        <VToolbarTitle class="text-primary-lighten-4 ml-4">
          <VIcon
            class="mx-2"
            color="primary-lighten-4"
            icon="mdi-earth-plus"
            size="small"
          />
          Discover Resources
        </VToolbarTitle>
        <template #append>
          <DiscoveryActions
            :selected-count="selectedUrls.size"
            :has-downloadable="hasDownloadable"
            :is-adding="isAdding"
            @add="addSelected"
          />
          <VBtn icon="mdi-close" @click="show = false" />
        </template>
      </VToolbar>
      <VContainer class="discovery-content pt-6" fluid>
        <VRow justify="center">
          <VCol cols="12" lg="10" xl="8">
            <TopicPicker
              v-if="hasOutline"
              v-model="selectedTopic"
              class="mb-4"
              @topic:clear="clearTopic"
            />
            <SearchBar
              v-model:query="query"
              v-model:content-filter="contentFilter"
              :is-searching="isSearching"
              @search="search"
              @search:input="selectedTopic = null"
            />
            <VAlert
              class="mb-4"
              color="primary-lighten-2"
              density="compact"
              icon="mdi-shield-check-outline"
              variant="tonal"
            >
              <span class="text-body-2">
                Verify that you have the right to use any content you import.
                Where available, licensing info is shown per result - review
                before adding.
              </span>
            </VAlert>
            <SearchResults
              v-model:page="page"
              :suggestions="suggestions"
              :selected-urls="selectedUrls"
              :is-searching="isSearching"
              :has-searched="hasSearched"
              @result:toggle="toggleSuggestion"
              @select:all="selectAll"
              @select:clear="selectedUrls.clear()"
              @search:cancel="isSearching = false"
            />
          </VCol>
        </VRow>
      </VContainer>
    </VCard>
  </VDialog>
</template>

<script lang="ts" setup>
import {
  ContentFilter,
  ContentType,
  type DiscoveryResult,
} from '@tailor-cms/interfaces/discovery';

import api from '@/api/repositoryAsset';
import { useCurrentRepository } from '@/stores/current-repository';
import DiscoveryActions from './DiscoveryActions.vue';
import SearchBar from './SearchBar.vue';
import SearchResults from './SearchResults/index.vue';
import TopicPicker from './TopicPicker/index.vue';
import type { TopicItem } from './TopicPicker/types';
import { useOutlineTree } from './TopicPicker/useOutlineTree';

const FETCH_COUNT = 100;
const MAX_QUERY_WORDS = 15;
const DOWNLOADABLE_TYPES = new Set([
  ContentType.Image,
  ContentType.Pdf,
  ContentType.Video,
]);

const show = defineModel<boolean>({ default: false });
const emit = defineEmits(['added']);

const notify = useNotification();
const store = useCurrentRepository();
const repositoryId = computed(
  () => store.repository?.id,
);

const query = ref('');
const contentFilter = ref<ContentFilter>(ContentFilter.All);
const selectedTopic = ref<TopicItem | null>(null);

const { hasOutline } = useOutlineTree();

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
  } catch {
    notify('Discovery search failed', { color: 'error' });
  } finally {
    hasSearched.value = true;
    isSearching.value = false;
  }
}

function clearTopic() {
  selectedTopic.value = null;
  query.value = '';
  suggestions.value = [];
  hasSearched.value = false;
}

function toggleSuggestion(url: string) {
  if (selectedUrls.has(url)) selectedUrls.delete(url);
  else selectedUrls.add(url);
}

function selectAll() {
  suggestions.value.forEach((s) => selectedUrls.add(s.url));
}

function toImportMeta(result?: DiscoveryResult) {
  if (!result) return {};
  const tags = [...(result.tags || [])];
  if (selectedTopic.value) {
    const topicName = selectedTopic.value.name;
    if (!tags.includes(topicName)) tags.push(topicName);
  }
  return {
    contentType: result.type,
    title: result.title,
    description: result.description || result.snippet,
    downloadUrl: result.downloadUrl,
    author: result.author,
    license: result.license,
    tags,
    altText: result.altText,
  };
}

async function addSelected(shouldIndex = false) {
  if (!repositoryId.value) return;
  isAdding.value = true;
  try {
    const byUrl = new Map(suggestions.value.map((s) => [s.url, s]));
    const imports = [...selectedUrls].map((url) =>
      api.importFromLink(repositoryId.value!, url, toImportMeta(byUrl.get(url)))
        .catch(() => null),
    );
    const results = await Promise.all(imports);
    const addedAssets = results.filter(Boolean);
    const failCount = results.length - addedAssets.length;
    if (failCount) {
      notify(`${failCount} of ${results.length} imports failed`, {
        color: 'warning',
      });
    }
    if (shouldIndex && addedAssets.length) {
      await api.indexAssets(
        repositoryId.value,
        addedAssets.map((a: any) => a.id),
      );
    }
    emit('added', addedAssets);
    show.value = false;
  } finally {
    isAdding.value = false;
  }
}

watch(show, (v) => {
  if (!v) return;
  query.value = '';
  contentFilter.value = ContentFilter.All;
  suggestions.value = [];
  selectedUrls.clear();
  hasSearched.value = false;
  page.value = 1;
  selectedTopic.value = null;
});

watch(selectedTopic, (topic) => {
  if (!topic) return;
  query.value = topic.context
    .join(' ')
    .split(/\s+/)
    .slice(0, MAX_QUERY_WORDS)
    .join(' ');
  search();
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

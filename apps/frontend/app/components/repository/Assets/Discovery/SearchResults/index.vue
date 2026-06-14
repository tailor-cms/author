<template>
  <div v-if="isSearching" class="d-flex flex-column align-center pa-12 ga-4">
    <span class="text-body-large">
      Searching the web for relevant resources...
    </span>
  </div>
  <template v-else-if="suggestions.length">
    <div class="d-flex align-center mb-3">
      <VChip
        prepend-icon="mdi-check-circle-outline"
        size="small"
        variant="tonal"
        rounded="lg"
      >
        {{ suggestions.length }} results
        <template v-if="selectedUrls.size">
          <VIcon icon="mdi-circle-small" size="x-small" />
          {{ selectedUrls.size }} selected
        </template>
      </VChip>
      <VSpacer />
      <VBtn
        prepend-icon="mdi-checkbox-multiple-outline"
        size="small"
        text="Select all"
        variant="text"
        @click="emit('select:all')"
      />
      <VBtn
        v-if="selectedUrls.size"
        prepend-icon="mdi-close-circle-outline"
        size="small"
        text="Clear"
        variant="text"
        @click="emit('select:clear')"
      />
    </div>
    <div class="d-flex flex-column ga-2">
      <SearchResult
        v-for="it in paginatedSuggestions"
        :key="it.url"
        :is-selected="selectedUrls.has(it.url)"
        :suggestion="it"
        @toggle="emit('result:toggle', it.url)"
      />
    </div>
    <div v-if="totalPages > 1" class="mt-4">
      <VPagination
        v-model="page"
        :length="totalPages"
        :total-visible="7"
        density="comfortable"
        rounded
      />
    </div>
  </template>
  <VAlert
    v-else-if="hasSearched"
    class="mt-4"
    icon="mdi-magnify-close"
    text="No results found. Try a different search query."
    variant="tonal"
  />
</template>

<script lang="ts" setup>
import type { DiscoveryResult } from '@tailor-cms/interfaces/discovery';

import SearchResult from './SearchResult/index.vue';

const ITEMS_PER_PAGE = 20;

const props = defineProps<{
  suggestions: DiscoveryResult[];
  selectedUrls: Set<string>;
  isSearching: boolean;
  hasSearched: boolean;
}>();

const page = defineModel<number>('page', { required: true });

const emit = defineEmits<{
  'result:toggle': [url: string];
  'select:all': [];
  'select:clear': [];
  'search:cancel': [];
}>();

const totalPages = computed(() =>
  Math.ceil(props.suggestions.length / ITEMS_PER_PAGE),
);

const paginatedSuggestions = computed(() => {
  const start = (page.value - 1) * ITEMS_PER_PAGE;
  return props.suggestions.slice(start, start + ITEMS_PER_PAGE);
});
</script>

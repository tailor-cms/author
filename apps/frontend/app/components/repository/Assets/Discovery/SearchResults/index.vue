<template>
  <div v-if="isSearching" class="d-flex justify-center pa-12">
    <span class="text-body-1 text-primary-lighten-3">
      Searching the web for relevant resources...
    </span>
  </div>
  <template v-else-if="suggestions.length">
    <div class="d-flex align-center mb-3">
      <VChip
        color="primary-lighten-2"
        prepend-icon="mdi-check-circle-outline"
        size="small"
        variant="tonal"
      >
        {{ suggestions.length }} results
      </VChip>
      <VSpacer />
      <VBtn
        v-if="selectedUrls.size"
        color="primary-lighten-3"
        prepend-icon="mdi-close-circle-outline"
        size="small"
        variant="text"
        @click="emit('deselect-all')"
      >
        Deselect all
      </VBtn>
      <VBtn
        v-else
        color="primary-lighten-3"
        prepend-icon="mdi-checkbox-multiple-outline"
        size="small"
        variant="text"
        @click="emit('select-all')"
      >
        Select all
      </VBtn>
    </div>
    <div class="d-flex flex-column ga-2">
      <SearchResult
        v-for="it in paginatedSuggestions"
        :key="it.url"
        :is-selected="selectedUrls.has(it.url)"
        :suggestion="it"
        @toggle="emit('toggle', it.url)"
      />
    </div>
    <div v-if="totalPages > 1" class="d-flex justify-center mt-4">
      <VPagination
        v-model="page"
        :length="totalPages"
        :total-visible="7"
        active-color="primary-lighten-4"
        color="primary-lighten-3"
        density="comfortable"
        rounded
      />
    </div>
  </template>
  <VAlert
    v-else-if="hasSearched"
    class="mt-4"
    color="primary-lighten-4"
    icon="mdi-magnify-close"
    variant="tonal"
  >
    No results found. Try a different search query.
  </VAlert>
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
  'toggle': [url: string];
  'select-all': [];
  'deselect-all': [];
}>();

const totalPages = computed(() =>
  Math.ceil(props.suggestions.length / ITEMS_PER_PAGE),
);

const paginatedSuggestions = computed(() => {
  const start = (page.value - 1) * ITEMS_PER_PAGE;
  return props.suggestions.slice(start, start + ITEMS_PER_PAGE);
});
</script>

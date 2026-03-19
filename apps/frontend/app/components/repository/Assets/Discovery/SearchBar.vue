<template>
  <div class="d-flex align-center ga-4 my-5">
    <VTextField
      v-model="query"
      :disabled="isSearching"
      color="primary-lighten-3"
      density="comfortable"
      label="What are you looking for?"
      max-width="500"
      placeholder="e.g. climate change statistics"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      rounded="xl"
      clearable
      hide-details
      @click:clear="query = ''"
      @keyup.enter="emit('search')"
    />
    <VBtn
      :loading="isSearching"
      color="primary-lighten-3"
      icon="mdi-magnify"
      variant="tonal"
      @click="query?.trim() &&emit('search')"
    >
    </VBtn>
  </div>
  <div class="d-flex flex-wrap align-center ga-2 ml-1 mb-6">
    <VBtn
      v-for="ct in CONTENT_FILTERS"
      :key="ct.value"
      :active="contentFilter === ct.value"
      :color="contentFilter === ct.value ? 'blue-lighten-4' : 'primary-lighten-3'"
      :prepend-icon="ct.icon"
      size="small"
      variant="tonal"
      @click="contentFilter = ct.value"
    >
      {{ ct.label }}
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
import type { ContentFilter } from '@tailor-cms/interfaces/discovery';

const CONTENT_FILTERS: { label: string; value: ContentFilter; icon: string }[] = [
  { label: 'All types', value: 'all', icon: 'mdi-view-grid' },
  { label: 'Images', value: 'image', icon: 'mdi-image-outline' },
  { label: 'PDFs', value: 'pdf', icon: 'mdi-file-document-outline' },
  { label: 'Articles', value: 'article', icon: 'mdi-newspaper' },
  { label: 'Research', value: 'research', icon: 'mdi-school' },
  { label: 'Data', value: 'data', icon: 'mdi-database' },
];

defineProps<{
  isSearching: boolean;
}>();

const emit = defineEmits<{ search: [] }>();

const query = defineModel<string>('query', { required: true });
const contentFilter = defineModel<ContentFilter>('contentFilter', { required: true });
</script>

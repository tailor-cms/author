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
      @update:model-value="emit('search:input')"
    />
    <VBtn
      :loading="isSearching"
      color="primary-lighten-3"
      icon="mdi-magnify"
      variant="tonal"
      @click="query?.trim() && emit('search')"
    >
    </VBtn>
  </div>
  <div class="d-flex flex-wrap align-center ga-2 ml-1 mb-6">
    <VBtn
      v-for="filter in CONTENT_FILTERS"
      :key="filter.value"
      :active="contentFilter === filter.value"
      :color="contentFilter === filter.value ? 'blue-lighten-4' : 'primary-lighten-3'"
      :prepend-icon="filter.icon"
      size="small"
      variant="tonal"
      @click="contentFilter = filter.value"
    >
      {{ filter.label }}
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
import type { ContentFilter } from '@tailor-cms/interfaces/discovery';

import { CONTENT_FILTERS } from './constants';

defineProps<{
  isSearching: boolean;
}>();

const emit = defineEmits<{
  'search': [];
  'search:input': [];
}>();

const query = defineModel<string>('query', { required: true });
const contentFilter = defineModel<ContentFilter>('contentFilter', { required: true });
</script>

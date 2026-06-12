<template>
  <div class="d-flex align-center ga-4 my-5">
    <VTextField
      v-model="query"
      :disabled="isSearching"
      bg-color="transparent"
      density="comfortable"
      label="What are you looking for?"
      max-width="500"
      placeholder="e.g. climate change statistics"
      prepend-inner-icon="mdi-magnify"
      rounded="pill"
      variant="solo-filled"
      clearable
      flat
      hide-details
      @click:clear="query = ''"
      @keyup.enter="emit('search')"
      @update:model-value="emit('search:input')"
    />
    <VBtn
      :loading="isSearching"
      icon="mdi-magnify"
      variant="tonal"
      @click="query?.trim() && emit('search')"
    >
    </VBtn>
  </div>
  <VChipGroup
    v-model="contentFilter"
    class="ml-1 mb-4"
    column
    mandatory
  >
    <VChip
      v-for="filter in CONTENT_FILTERS"
      :key="filter.value"
      :text="filter.label"
      :value="filter.value"
      color="secondary"
      role="button"
      size="small"
      rounded="pill"
      filter
    />
  </VChipGroup>
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

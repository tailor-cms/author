<template>
  <div class="search-bar position-relative d-flex align-center ga-3 px-4 py-2">
    <MessageComposer
      :model-value="query"
      class="flex-grow-1"
      placeholder="Search messages - @ for people, # for items"
      variant="search"
      @update:model-value="search"
    />
    <span
      v-if="hasSummary"
      class="search-summary text-body-small text-medium-emphasis text-no-wrap"
    >
      {{ pluralize('result', total, true) }}
    </span>
    <VBtn
      v-if="hasQuery"
      v-tooltip:bottom="'Clear search'"
      aria-label="Clear search"
      density="comfortable"
      icon="mdi-close"
      size="small"
      variant="text"
      @click="clear"
    />
    <VProgressLinear
      :active="isSearching"
      color="primary"
      height="2"
      location="bottom"
      absolute
      indeterminate
    />
  </div>
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import { MessageComposer } from '@tailor-cms/core-components';
import pluralize from 'pluralize-esm';

interface Props {
  query: string;
  total: number;
  isSearching?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isSearching: false });
const emit = defineEmits<{ search: [query: string]; clear: [] }>();

const hasQuery = computed(() => !!props.query.trim());
const hasSummary = computed(() => hasQuery.value && !props.isSearching);

const SEARCH_DELAY_MS = 300;

const search = debounce(
  (value: string) => emit('search', value),
  SEARCH_DELAY_MS,
);

const clear = () => {
  search.cancel();
  emit('clear');
};

onBeforeUnmount(() => search.cancel());
</script>

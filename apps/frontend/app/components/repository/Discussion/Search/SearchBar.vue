<template>
  <div class="search-bar position-relative d-flex align-center ga-3 py-3 px-4">
    <MessageSearch
      :model-value="query"
      class="flex-grow-1"
      autofocus
      placeholder="Search messages - @ for people, # for items"
      @escape="close"
      @update:model-value="search"
    />
    <span
      v-if="hasSummary"
      class="search-summary text-body-small text-medium-emphasis text-no-wrap"
    >
      {{ pluralize('result', total, true) }}
    </span>
    <VBtn
      v-tooltip:bottom="'Close search'"
      aria-label="Close search"
      density="comfortable"
      icon="mdi-close"
      size="small"
      variant="text"
      @click="close"
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
import { MessageSearch } from '@tailor-cms/core-components';
import pluralize from 'pluralize-esm';

interface Props {
  query: string;
  total: number;
  isSearching?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isSearching: false });
const emit = defineEmits<{ search: [query: string]; close: [] }>();

const hasQuery = computed(() => !!props.query.trim());
const hasSummary = computed(() => hasQuery.value && !props.isSearching);

const SEARCH_DELAY_MS = 300;

const search = debounce(
  (value: string) => emit('search', value),
  SEARCH_DELAY_MS,
);

const close = () => {
  search.cancel();
  emit('close');
};

onBeforeUnmount(() => search.cancel());
</script>

<style lang="scss" scoped>
.search-bar {
  background: rgb(var(--v-theme-surface-container-high));
}
</style>

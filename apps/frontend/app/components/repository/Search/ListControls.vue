<template>
  <div class="d-flex align-center justify-end flex-wrap ga-2">
    <VBtn
      :aria-label="isCompact ? 'Switch to comfortable view' : 'Switch to compact view'"
      :color="isCompact ? 'secondary' : undefined"
      size="small"
      variant="text"
      icon
      @click="isCompact = !isCompact"
    >
      <VIcon
        :icon="isCompact ? 'mdi-view-agenda-outline' : 'mdi-view-sequential-outline'"
      />
      <VTooltip
        :text="isCompact ? 'Comfortable view' : 'Compact view'"
        activator="parent"
        location="top"
      />
    </VBtn>
    <VMenu>
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          :text="activeSortLabel"
          append-icon="mdi-chevron-down"
          prepend-icon="mdi-sort"
          size="small"
          variant="text"
        />
      </template>
      <VList density="compact" nav>
        <VListItem
          v-for="option in sortOptions"
          :key="option.value"
          :active="sort === option.value"
          :title="option.title"
          @click="sort = option.value"
        />
      </VList>
    </VMenu>
    <VMenu>
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          :text="`${itemsPerPage} per page`"
          append-icon="mdi-chevron-down"
          size="small"
          variant="text"
        />
      </template>
      <VList density="compact" nav>
        <VListItem
          v-for="size in PAGE_SIZE_OPTIONS"
          :key="size"
          :active="itemsPerPage === size"
          :title="`${size} per page`"
          @click="itemsPerPage = size"
        />
      </VList>
    </VMenu>
  </div>
</template>

<script lang="ts" setup>
import { PAGE_SIZE_OPTIONS, type SearchSort } from './composables';

const props = defineProps<{ isSearchActive: boolean }>();

const sort = defineModel<SearchSort>('sort', { required: true });
const itemsPerPage = defineModel<number>('itemsPerPage', { required: true });
const isCompact = defineModel<boolean>('isCompact', { required: true });

const sortOptions = computed(() => [
  ...(props.isSearchActive
    ? [{ value: 'relevance' as SearchSort, title: 'Most relevant' }]
    : []),
  { value: 'newest' as SearchSort, title: 'Newest first' },
  { value: 'oldest' as SearchSort, title: 'Oldest first' },
]);

const activeSortLabel = computed(
  () =>
    sortOptions.value.find((it) => it.value === sort.value)?.title ??
    'Most relevant',
);
</script>

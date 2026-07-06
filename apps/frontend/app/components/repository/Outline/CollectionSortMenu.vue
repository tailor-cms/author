<template>
  <VMenu location="bottom end">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-if="compact"
        v-tooltip:bottom="{ text: `Sort: ${activeSortLabel}`, openDelay: 500 }"
        v-bind="menuProps"
        :aria-label="`Sort: ${activeSortLabel}`"
        class="sort-btn"
        density="comfortable"
        icon="mdi-sort-variant"
        size="small"
        variant="text"
      />
      <VBtn
        v-else
        v-bind="menuProps"
        :text="activeSortLabel"
        append-icon="mdi-chevron-down"
        class="sort-btn"
        prepend-icon="mdi-sort-variant"
        rounded="lg"
        size="small"
        variant="text"
      />
    </template>
    <VList density="compact" min-width="220" slim nav>
      <VListSubheader>Sort by</VListSubheader>
      <VListItem
        v-for="option in sortOptions"
        :key="`${option.key}-${option.order}`"
        :active="isActiveSort(option)"
        :prepend-icon="isActiveSort(option) ? 'mdi-check' : 'mdi-blank'"
        :title="option.title"
        @click="modelValue = { key: option.key, order: option.order }"
      />
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import type { CollectionSort } from '@/composables/useCollectionEntities';

interface SortOption extends CollectionSort {
  title: string;
}

defineProps<{
  compact?: boolean;
}>();

const modelValue = defineModel<CollectionSort>({ required: true });

const sortOptions: SortOption[] = [
  { key: 'createdAt', order: 'desc', title: 'Newest first' },
  { key: 'createdAt', order: 'asc', title: 'Oldest first' },
  { key: 'data.name', order: 'asc', title: 'Name (A–Z)' },
  { key: 'data.name', order: 'desc', title: 'Name (Z–A)' },
];

const isActiveSort = (option: SortOption) =>
  modelValue.value.key === option.key && modelValue.value.order === option.order;

const activeSortLabel = computed(
  () => sortOptions.find(isActiveSort)?.title ?? 'Sort',
);
</script>

<style lang="scss" scoped>
.sort-btn {
  opacity: 0.85;

  &:hover {
    opacity: 1;
  }
}
</style>

<template>
  <div class="collection-wrapper">
    <div class="d-flex align-center ga-3 mb-4">
      <EntityFilter
        v-if="hasMultipleEntities"
        v-model="selectedEntity"
        :entities="entities"
      />
      <VSpacer />
      <VMenu class="ml-auto" location="bottom end">
        <template #activator="{ props: menuProps }">
          <VBtn
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
            @click="sort = { key: option.key, order: option.order }"
          />
        </VList>
      </VMenu>
    </div>
    <template v-if="hasActivities">
      <VEmptyState
        v-if="!sortedItems.length"
        class="py-16 rounded-lg"
        bg-color="surface-container"
        icon="mdi-magnify"
        title="No matches found."
        text="Try adjusting your search."
      />
      <VList v-else bg-color="transparent" class="collection-list pa-0">
        <CollectionItem
          v-for="item in sortedItems"
          :key="item.id"
          :activity="item"
        />
      </VList>
    </template>
    <VEmptyState
      v-else
      class="py-16 rounded-lg"
      bg-color="surface-container"
      icon="mdi-view-list"
      title="No items yet."
      text="Click the Create button above to add your first item."
    />
  </div>
</template>

<script lang="ts" setup>
import { orderBy } from 'lodash-es';
import { storeToRefs } from 'pinia';

import type { CollectionSort } from '@/composables/useCollectionEntities';
import CollectionItem from '@/components/repository/Outline/CollectionItem.vue';
import EntityFilter from '@/components/repository/Outline/EntityFilter.vue';
import { useCurrentRepository } from '@/stores/current-repository';

interface SortOption extends CollectionSort {
  title: string;
}

const props = defineProps<{
  search: string;
}>();

const selectedEntity = defineModel<string>('selectedEntity', { default: '' });

const { entities, hasMultipleEntities } = useCollectionEntities();

const sort = ref<CollectionSort>({ key: 'createdAt', order: 'desc' });

const sortOptions: SortOption[] = [
  { key: 'createdAt', order: 'desc', title: 'Newest first' },
  { key: 'createdAt', order: 'asc', title: 'Oldest first' },
  { key: 'data.name', order: 'asc', title: 'Name (A–Z)' },
  { key: 'data.name', order: 'desc', title: 'Name (Z–A)' },
];

const isActiveSort = (option: SortOption) =>
  sort.value.key === option.key && sort.value.order === option.order;

const activeSortLabel = computed(
  () => sortOptions.find(isActiveSort)?.title ?? 'Sort',
);

const repositoryStore = useCurrentRepository();
const { outlineActivities, rootActivities } = storeToRefs(repositoryStore);

const hasActivities = computed(() => !!rootActivities.value.length);

const filteredActivities = computed(() => {
  if (!props.search) return outlineActivities.value;
  const regex = new RegExp(props.search.trim(), 'i');
  return outlineActivities.value.filter(({ shortId, data: { name } }) => {
    return regex.test(shortId) || regex.test(name as string);
  });
});

const visibleCollectionItems = computed(() =>
  filteredActivities.value.filter((it) => it.type === selectedEntity.value),
);

const sortedItems = computed(() =>
  orderBy(visibleCollectionItems.value, [sort.value.key], [sort.value.order]),
);
</script>

<style lang="scss" scoped>
.collection-wrapper {
  flex: 0 0 auto;
}

.collection-list {
  background: transparent;
  text-align: left;
}

.sort-btn {
  opacity: 0.85;

  &:hover {
    opacity: 1;
  }
}
</style>

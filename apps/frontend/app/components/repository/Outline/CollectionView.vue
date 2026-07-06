<template>
  <div class="collection-wrapper">
    <div class="d-flex align-center ga-3 mb-4">
      <EntityFilter
        v-if="hasMultipleEntities"
        v-model="selectedEntity"
        :entities="entities"
      />
      <VSpacer />
      <CollectionSortMenu v-model="sort" />
    </div>
    <template v-if="hasActivities">
      <TailorEmptyState
        v-if="!sortedItems.length"
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
    <TailorEmptyState
      v-else
      icon="mdi-view-list"
      title="No items yet."
      text="Click the Create button above to add your first item."
    />
  </div>
</template>

<script lang="ts" setup>
import CollectionItem from '@/components/repository/Outline/CollectionItem.vue';
import CollectionSortMenu from '@/components/repository/Outline/CollectionSortMenu.vue';
import EntityFilter from '@/components/repository/Outline/EntityFilter.vue';
import { TailorEmptyState } from '@tailor-cms/core-components';

const props = defineProps<{
  search: string;
}>();

const selectedEntity = defineModel<string>('selectedEntity', { default: '' });

const { entities, hasMultipleEntities } = useCollectionEntities();
const { sort, sortedItems, hasActivities } = useCollectionList(
  () => props.search,
  selectedEntity,
);
</script>

<style lang="scss" scoped>
.collection-wrapper {
  flex: 0 0 auto;
}

.collection-list {
  overflow: visible;
  text-align: left;
}
</style>

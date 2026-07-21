<template>
  <div class="collection-wrapper">
    <template v-if="hasActivities">
      <div class="d-flex align-center ga-3 mb-4">
        <EntityFilter
          v-if="hasMultipleEntities"
          v-model="selectedEntity"
          :entities="entities"
        />
        <VSpacer />
        <CollectionSortMenu v-model="sort" />
      </div>
      <TailorEmptyState
        v-if="!sortedItems.length"
        :action-text="search ? 'Clear search' : undefined"
        :prepend-action-icon="search ? 'mdi-close' : undefined"
        icon="mdi-magnify"
        text="No items match your search."
        title="No matches"
        @click:action="search = ''"
      />
      <VList v-else bg-color="transparent" class="collection-list pa-0">
        <CollectionItem
          v-for="item in sortedItems"
          :key="item.id"
          :activity="item"
        />
      </VList>
    </template>
    <CollectionEmptyState v-else />
  </div>
</template>

<script lang="ts" setup>
import CollectionEmptyState
  from '@/components/repository/Outline/CollectionEmptyState/index.vue';
import CollectionItem from '@/components/repository/Outline/CollectionItem.vue';
import CollectionSortMenu from '@/components/repository/Outline/CollectionSortMenu.vue';
import EntityFilter from '@/components/repository/Outline/EntityFilter.vue';
import { TailorEmptyState } from '@tailor-cms/core-components';

const search = defineModel<string>('search', { required: true });
const selectedEntity = defineModel<string>('selectedEntity', { default: '' });

const { entities, hasMultipleEntities } = useCollectionEntities();
const { sort, sortedItems, hasActivities } = useCollectionList(
  () => search.value,
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

<template>
  <VAlert
    v-if="!sortedActivities.length"
    class="my-4"
    color="primary-lighten-3"
    icon="mdi-magnify"
    variant="tonal"
    prominent
  >
    No matches found!
  </VAlert>
  <VList v-else bg-color="transparent" class="collection-list pa-0">
    <CollectionItem
      v-for="item in sortedActivities"
      :key="item.id"
      :activity="item"
    />
  </VList>
</template>

<script lang="ts" setup>
import { orderBy } from 'lodash-es';

import CollectionItem from '@/components/repository/Outline/CollectionItem.vue';
import type { StoreActivity } from '@/stores/activity';

interface CollectionSort {
  key: 'data.name' | 'createdAt';
  order: 'asc' | 'desc';
}

const props = defineProps<{
  activities: StoreActivity[];
  sort: CollectionSort;
}>();

const sortedActivities = computed(() =>
  orderBy(props.activities, [props.sort.key], [props.sort.order]),
);
</script>

<style lang="scss" scoped>
.collection-list {
  background: transparent;
  text-align: left;
}
</style>

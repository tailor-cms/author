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
      v-for="item in paginatedItems"
      :key="item.id"
      :activity="item"
    />
  </VList>
  <div v-if="sortedActivities.length" class="list-footer mt-2 px-1">
    <span class="text-caption text-primary-lighten-4">
      Showing {{ rangeStart }}–{{ rangeEnd }} of {{ sortedActivities.length }}
    </span>
    <VPagination
      v-if="pageCount > 1"
      v-model="page"
      :length="pageCount"
      :total-visible="7"
      active-color="primary-lighten-4"
      color="primary-lighten-3"
      density="comfortable"
      rounded
    />
  </div>
</template>

<script lang="ts" setup>
import { orderBy } from 'lodash-es';

import CollectionItem from '@/components/repository/Outline/CollectionItem.vue';
import type { CollectionSort } from '@/components/repository/Outline/collectionSort';
import type { StoreActivity } from '@/stores/activity';

const ITEMS_PER_PAGE = 15;

const props = defineProps<{
  activities: StoreActivity[];
  sort: CollectionSort;
}>();

const page = ref(1);

const sortedActivities = computed(() =>
  orderBy(props.activities, [props.sort.key], [props.sort.order]),
);

const pageCount = computed(() =>
  Math.max(1, Math.ceil(sortedActivities.value.length / ITEMS_PER_PAGE)),
);

const paginatedItems = computed(() => {
  const start = (page.value - 1) * ITEMS_PER_PAGE;
  return sortedActivities.value.slice(start, start + ITEMS_PER_PAGE);
});

const rangeStart = computed(() =>
  sortedActivities.value.length ? (page.value - 1) * ITEMS_PER_PAGE + 1 : 0,
);
const rangeEnd = computed(() =>
  Math.min(page.value * ITEMS_PER_PAGE, sortedActivities.value.length),
);

watch(pageCount, (count) => {
  if (page.value > count) page.value = count;
});

watch(
  () => [props.activities.length, props.sort.key, props.sort.order],
  () => {
    page.value = 1;
  },
);
</script>

<style lang="scss" scoped>
.collection-list {
  background: transparent;
  text-align: left;
}

.list-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

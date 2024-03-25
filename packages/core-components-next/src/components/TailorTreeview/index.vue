<template>
  <div v-if="hasItems" class="d-flex flex-column align-end">
    <VBtn
      class="mr-5"
      color="teal-lighten-4"
      size="x-small"
      variant="tonal"
      @click="toggleExpand"
    >
      {{ hasExpandedItems ? 'Collapse' : 'Expand' }} all
    </VBtn>
  </div>
  <VList v-model:opened="expanded">
    <ItemGroup
      v-for="item in processedItems"
      :key="item.id"
      :active-item-id="activeItemId"
      :item="item"
      @edit="emit('edit', $event)"
    />
  </VList>
  <VAlert
    v-if="search && !hasItems"
    class="mx-4"
    icon="mdi-information-outline"
    variant="tonal"
  >
    No items found!
  </VAlert>
</template>

<script setup lang="ts">
import { computed, defineProps, onBeforeMount, ref, watch } from 'vue';
import cloneDeep from 'lodash/cloneDeep';

import ItemGroup from './ItemGroup.vue';

const props = defineProps<{
  items: any[];
  activeItemId: number;
  search: string;
}>();

const emit = defineEmits(['edit']);

const expanded = ref<number[]>([]);

const processedItems = computed(() => {
  if (!props.search) return props.items;
  // clone the items to avoid modifying the original
  const items = cloneDeep(props.items);
  return items.filter(searchRecursive);
});

const doesTitleMatchSearch = (title: string) =>
  title.toLowerCase().includes(props.search.toLowerCase());

const searchRecursive = (item: any): any => {
  if (doesTitleMatchSearch(item.title)) return item;
  if (item.children) return item.children.some(searchRecursive);
  item.isVisible = false;
  return false;
};

const hasItems = computed(() => processedItems.value.length > 0);
const hasExpandedItems = computed(() => expanded.value.length > 0);

const getGroupIds = (items: any[]): number[] =>
  items.map((it: any) => (it.children?.length ? it.id : null)).filter(Boolean);

const toggleExpand = () => {
  if (hasExpandedItems.value) {
    expanded.value = [];
    return;
  }
  expanded.value = getGroupIds(processedItems.value);
};

const findAncestors = (items: any, id: number, parents: any[] = []): any[] => {
  const item = items.find((it: any) => it.id === id);
  if (item) return [...parents, item];
  return items
    .map((it: any) =>
      it.children?.length
        ? findAncestors(it.children, id, [...parents, it])
        : [],
    )
    .flat()
    .filter(Boolean);
};

watch(
  () => props.search,
  () => {
    expanded.value = getGroupIds(processedItems.value);
  },
);

onBeforeMount(() => {
  const ancestors = findAncestors(props.items, props.activeItemId);
  expanded.value = getGroupIds(ancestors);
});
</script>

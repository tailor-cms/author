<template>
  <div
    v-if="hasItems"
    :class="{ 'd-flex flex-column align-end': true, 'mt-5': search }"
  >
    <VBtn
      v-if="!search"
      class="mr-5"
      color="teal-lighten-4"
      size="x-small"
      variant="tonal"
      @click="toggleExpand"
    >
      Toggle all
    </VBtn>
  </div>
  <VList v-model:opened="expanded" slim>
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
import { computed, ref, watch } from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import uniq from 'lodash/uniq';

import ItemGroup from './ItemGroup.vue';

const props = defineProps<{
  items: any[];
  activeItemId: number;
  search: string;
}>();

const emit = defineEmits(['edit']);

const expanded = ref<number[]>([]);

const flatItems = computed(() => flatTree(props.items));

const processedItems = computed(() => {
  if (!props.search) return props.items;
  // clone the items to avoid modifying the original
  const items = cloneDeep(props.items);
  return items.filter(searchRecursive);
});

const hasItems = computed(() => processedItems.value.length > 0);

const expandableItemIds = computed(() => getGroupIds(flatItems.value));

const doesTitleMatchSearch = (title: string) =>
  title.toLowerCase().includes(props.search.toLowerCase());

const searchRecursive = (item: any): any => {
  if (doesTitleMatchSearch(item.title)) return item;
  if (item.children) return item.children.some(searchRecursive);
  item.isVisible = false;
  return false;
};

const isFullyExpanded = computed(
  () => expandableItemIds.value.length === expanded.value.length,
);

const toggleExpand = () => {
  expanded.value = isFullyExpanded.value ? [] : expandableItemIds.value;
};

const flatTree = (tree: any) =>
  tree.reduce(
    (acc: any, it: any) =>
      it.children?.length
        ? [...acc, it, ...flatTree(it.children)]
        : [...acc, it],
    [],
  );

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

const getGroupIds = (items: any[]): number[] =>
  items.filter((it: any) => it.isGroup).map((it) => it.id);

watch(
  () => props.search,
  () => {
    expanded.value = expandableItemIds.value;
  },
);

watch(
  () => props.items,
  () => {
    if (expanded.value.length) return;
    const ancestors = findAncestors(props.items, props.activeItemId);
    expanded.value = uniq([...expanded.value, ...getGroupIds(ancestors)]);
  },
  { deep: true },
);
</script>

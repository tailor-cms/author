<template>
  <div v-if="items.length">
    <div class="mt-4 mb-2 text-body-medium font-weight-bold">
      Suggested outline:
    </div>
    <VTreeview
      :items="normalizedItems"
      :prepend-gap="0"
      bg-color="transparent"
      class="py-0"
      density="compact"
      item-children="children"
      item-title="name"
      item-value="name"
      indent-lines
      open-all
    />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  items: any[];
}>();

interface OutlineNode {
  name: string;
  children?: OutlineNode[];
}

const stripEmptyChildren = (nodes: OutlineNode[]): OutlineNode[] =>
  nodes.map(({ children, ...rest }) => ({
    ...rest,
    ...(children && children.length
      ? { children: stripEmptyChildren(children) }
      : {}),
  }));

const normalizedItems = computed(() => stripEmptyChildren(props.items));
</script>

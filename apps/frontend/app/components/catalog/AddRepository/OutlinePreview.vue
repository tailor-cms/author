<template>
  <div v-if="items.length">
    <div class="my-4 text-body-medium font-weight-bold">Suggested outline:</div>
    <VTreeview
      :items="normalizedItems"
      class="mb-8"
      item-title="name"
      item-value="name"
      item-children="children"
      indent-lines="default"
      open-all
      bg-color="transparent"
      density="compact"
      :prepend-gap="0"
      slim
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

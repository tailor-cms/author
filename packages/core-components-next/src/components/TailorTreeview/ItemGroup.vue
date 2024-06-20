<template>
  <VListGroup v-if="item.children?.length" :value="item.id">
    <template #activator="{ props: activatorProps, isOpen }">
      <ListItem
        v-bind="{ ...activatorProps, ...item, isOpen, isGroup: true }"
      />
    </template>
    <ItemGroup
      v-for="subItem in item.children"
      :key="subItem.id"
      :active-item-id="activeItemId"
      :item="subItem"
      @edit="emit('edit', $event)"
    />
  </VListGroup>
  <ListItem
    v-else
    v-bind="item"
    :is-active="activeItemId === item?.id"
    @edit="emit('edit', $event)"
  />
</template>

<script lang="ts" setup>
import ItemGroup from './ItemGroup.vue';
import ListItem from './ListItem.vue';

defineProps<{
  item: any;
  activeItemId: number;
}>();

const emit = defineEmits(['edit']);
</script>

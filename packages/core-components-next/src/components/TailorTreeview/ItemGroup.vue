<template>
  <VListGroup v-if="item.children?.length" :value="item.id">
    <template #activator="{ props: activatorProps, isOpen }">
      <ListItem v-bind="{ ...activatorProps, ...bindings, isOpen }" is-group />
    </template>
    <ItemGroup
      v-for="subItem in item.children"
      :key="subItem.id"
      :active-item-id="activeItemId"
      :item="subItem"
      @edit="emit('edit', $event)"
    />
  </VListGroup>
  <ListItem v-else v-bind="bindings" @edit="emit('edit', $event)" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import ItemGroup from './ItemGroup.vue';
import ListItem from './ListItem.vue';

const props = defineProps<{
  item: any;
  activeItemId: number;
}>();

const bindings = computed(() => {
  const { id, isEditable, title } = props.item;
  return {
    id,
    title,
    isEditable,
    isActive: props.activeItemId === id,
  };
});

const emit = defineEmits(['edit']);
</script>

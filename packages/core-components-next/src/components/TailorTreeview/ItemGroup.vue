<template>
  <VListGroup v-if="item?.children?.length" :value="item?.id">
    <template #activator="{ props: activatorProps, isOpen }">
      <ListItem
        v-bind="{ ...activatorProps, ...item, isOpen, isGroup: true }"
      />
    </template>
    <ItemGroup
      v-for="subItem in item.children"
      :key="subItem.id"
      :item="subItem"
      @edit="emit('edit', $event)"
    />
  </VListGroup>
  <ListItem v-else v-bind="item" @edit="emit('edit', $event)" />
</template>

<script lang="ts" setup>
import { defineEmits, defineProps } from 'vue';

import ItemGroup from './ItemGroup.vue';
import ListItem from './Item.vue';

defineProps<{
  item: any;
}>();

const emit = defineEmits(['edit']);
</script>

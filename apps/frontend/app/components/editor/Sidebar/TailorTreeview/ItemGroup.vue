<template>
  <VListGroup v-if="item.isGroup" :value="item.id">
    <template #activator="{ props: activatorProps, isOpen }">
      <ListItem
        v-bind="{ ...bindings, isOpen, activatorProps }"
        :is-empty="!item.children.length"
        is-group
        @edit="emit('edit', $event)"
      />
    </template>
    <Draggable
      :data-parent-id="item.id"
      :list="item.children"
      :move="repositoryStore.isValidDrop"
      group="activities"
      item-key="uid"
      @update="(data: any) => reorder(data, item.children)"
      @change="(e: any) => repositoryStore.handleOutlineItemDrag(e, item.id)"
    >
      <template #item="{ element }">
        <ItemGroup
          :active-item-id="activeItemId"
          :item="element"
          @edit="emit('edit', $event)"
        />
      </template>
    </Draggable>
  </VListGroup>
  <ListItem v-else v-bind="bindings" @edit="emit('edit', $event)" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import Draggable from 'vuedraggable';

import { useCurrentRepository } from '@/stores/current-repository';

import ItemGroup from './ItemGroup.vue';
import ListItem from './ListItem.vue';

const props = defineProps<{
  item: any;
  activeItemId: number;
}>();

const emit = defineEmits(['edit']);

const repositoryStore = useCurrentRepository();
const reorder = useOutlineReorder();

const bindings = computed(() => {
  const { id, isEditable, title } = props.item;
  return {
    id,
    title,
    isEditable,
    isActive: props.activeItemId === id,
  };
});
</script>

<style lang="scss" scoped>
.v-list-group {
  --list-indent-size: 0.75rem;
}
</style>
